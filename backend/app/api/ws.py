import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger()

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # We store active connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("ws_client_connected", active_clients=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("ws_client_disconnected", active_clients=len(self.active_connections))

    async def broadcast(self, topic: str, data: Any):
        if not self.active_connections:
            return

        from backend.app.core.crypto import encrypt_string

        payload = json.dumps({"topic": topic, "data": data}, default=str)
        # Encrypt the payload for meaningful security in transit
        encrypted_payload = encrypt_string(payload)
        
        # We need to create tasks for all sends so a slow client doesn't block the loop
        tasks = []
        for connection in self.active_connections:
            tasks.append(asyncio.create_task(self._send(connection, encrypted_payload)))
            
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            
    async def _send(self, websocket: WebSocket, text_data: str):
        try:
            await websocket.send_text(text_data)
        except Exception:
            self.disconnect(websocket)

# Global connection manager instance
manager = ConnectionManager()

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We just keep the connection open. The client doesn't need to send anything,
            # but we read to detect disconnects.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("ws_error", error=str(e))
        manager.disconnect(websocket)
