import asyncio
import json
from collections import defaultdict
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

from backend.app.core.crypto import verify_session_token, encrypt_for_broadcast

logger = structlog.get_logger()
router = APIRouter()

_MAX_CONNECTIONS_PER_IP = 5
_connections_by_ip: Dict[str, int] = defaultdict(int)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._queues: Dict[WebSocket, asyncio.Queue] = {}
        self._send_tasks: Dict[WebSocket, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket):
        self.active_connections.append(websocket)
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._queues[websocket] = queue
        self._send_tasks[websocket] = asyncio.create_task(self._drain_queue(websocket, queue))
        logger.info("ws_client_connected", active_clients=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        task = self._send_tasks.pop(websocket, None)
        if task:
            task.cancel()
        self._queues.pop(websocket, None)
        client_ip = websocket.client.host if websocket.client else "unknown"
        if _connections_by_ip[client_ip] > 0:
            _connections_by_ip[client_ip] -= 1
        logger.info("ws_client_disconnected", active_clients=len(self.active_connections))

    async def broadcast(self, topic: str, data: Any):
        if not self.active_connections:
            return
        encrypted_hex = encrypt_for_broadcast({"topic": topic, "data": data})
        stale = []
        for ws in list(self.active_connections):
            queue = self._queues.get(ws)
            if queue is None:
                continue
            try:
                queue.put_nowait(encrypted_hex)
            except asyncio.QueueFull:
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
                try:
                    queue.put_nowait(encrypted_hex)
                except asyncio.QueueFull:
                    stale.append(ws)
        for ws in stale:
            self.disconnect(ws)

    async def _drain_queue(self, websocket: WebSocket, queue: asyncio.Queue):
        try:
            while True:
                message = await queue.get()
                try:
                    await websocket.send_text(message)
                except Exception:
                    self.disconnect(websocket)
                    break
        except asyncio.CancelledError:
            pass


manager = ConnectionManager()


@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    # Accept first, then authenticate via first message (token NOT in URL)
    await websocket.accept()
    
    # Rate limit per IP
    client_ip = websocket.client.host if websocket.client else "unknown"
    if _connections_by_ip[client_ip] >= _MAX_CONNECTIONS_PER_IP:
        await websocket.send_text(json.dumps({"error": "rate_limited", "detail": "Too many connections"}))
        await websocket.close(code=4029)
        return
    _connections_by_ip[client_ip] += 1
    
    # Wait for auth message (first message must be auth)
    try:
        auth_raw = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
        auth_msg = json.loads(auth_raw)
        
        if auth_msg.get("type") != "auth" or not auth_msg.get("token"):
            await websocket.send_text(json.dumps({"error": "auth_required", "detail": "First message must be {type: 'auth', token: '...'}"}))
            await websocket.close(code=4001)
            _connections_by_ip[client_ip] = max(0, _connections_by_ip[client_ip] - 1)
            return
        
        claims = verify_session_token(auth_msg["token"], required_scope="dashboard")
        if not claims:
            await websocket.send_text(json.dumps({"error": "unauthorized", "detail": "Invalid or expired token"}))
            await websocket.close(code=4001)
            _connections_by_ip[client_ip] = max(0, _connections_by_ip[client_ip] - 1)
            return
        
        # Auth success — send confirmation
        await websocket.send_text(json.dumps({"type": "auth_ok", "tier": claims.get("tier", "guest")}))
        
    except asyncio.TimeoutError:
        await websocket.close(code=4001, reason="Auth timeout")
        _connections_by_ip[client_ip] = max(0, _connections_by_ip[client_ip] - 1)
        return
    except Exception:
        await websocket.close(code=4001)
        _connections_by_ip[client_ip] = max(0, _connections_by_ip[client_ip] - 1)
        return
    
    # Authenticated — register for broadcast
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("ws_error", error=str(e))
        manager.disconnect(websocket)
