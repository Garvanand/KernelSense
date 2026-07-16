import asyncio
import json
from collections import defaultdict
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import structlog
import time

from backend.app.core.crypto import verify_session_token, encrypt_json

logger = structlog.get_logger()

router = APIRouter()

# Rate limiting: max connections per IP
_MAX_CONNECTIONS_PER_IP = 5
_connections_by_ip: Dict[str, int] = defaultdict(int)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Bounded queue per connection for backpressure (Phase 2A)
        self._queues: Dict[WebSocket, asyncio.Queue] = {}
        self._send_tasks: Dict[WebSocket, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Create a bounded outbound queue for this connection
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._queues[websocket] = queue
        self._send_tasks[websocket] = asyncio.create_task(self._drain_queue(websocket, queue))
        
        logger.info("ws_client_connected", active_clients=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Cancel the drain task
        task = self._send_tasks.pop(websocket, None)
        if task:
            task.cancel()
        self._queues.pop(websocket, None)
        
        # Decrement IP counter
        client_ip = websocket.client.host if websocket.client else "unknown"
        _connections_by_ip[client_ip] = max(0, _connections_by_ip[client_ip] - 1)
        
        logger.info("ws_client_disconnected", active_clients=len(self.active_connections))

    async def broadcast(self, topic: str, data: Any):
        """Encrypt and enqueue data to all connected clients with backpressure."""
        if not self.active_connections:
            return

        # Encrypt the entire payload with AES-256-GCM
        encrypted_hex = encrypt_json({"topic": topic, "data": data})
        
        stale = []
        for ws in self.active_connections:
            queue = self._queues.get(ws)
            if queue is None:
                continue
            try:
                queue.put_nowait(encrypted_hex)
            except asyncio.QueueFull:
                # Backpressure: drop oldest frame, enqueue new one
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
        """Background task that sends queued messages to the client."""
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


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(default="")):
    # Phase 1D: Authenticate before accepting
    if not token or not verify_session_token(token, required_scope="dashboard"):
        await websocket.close(code=4001, reason="Unauthorized: invalid or missing token")
        return
    
    # Rate limiting per IP
    client_ip = websocket.client.host if websocket.client else "unknown"
    if _connections_by_ip[client_ip] >= _MAX_CONNECTIONS_PER_IP:
        await websocket.close(code=4029, reason="Too many connections from this IP")
        return
    _connections_by_ip[client_ip] += 1
    
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; read to detect disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("ws_error", error=str(e))
        manager.disconnect(websocket)
