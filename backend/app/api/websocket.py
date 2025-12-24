from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Set
import asyncio
import json
import logging
import websockets

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[str, Set[WebSocket]] = {}  # symbol -> connections
        self.openalgo_ws: websockets.WebSocketClientProtocol | None = None
        self.openalgo_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Remove from all subscriptions
        for symbol in list(self.subscriptions.keys()):
            self.subscriptions[symbol].discard(websocket)
            if not self.subscriptions[symbol]:
                del self.subscriptions[symbol]
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast to all connections"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def send_to_symbol_subscribers(self, symbol: str, exchange: str, data: dict):
        """Send data to subscribers of a specific symbol"""
        key = f"{exchange}:{symbol}"
        if key in self.subscriptions:
            for connection in self.subscriptions[key]:
                try:
                    await connection.send_json({
                        "type": "ltp",
                        "symbol": symbol,
                        "exchange": exchange,
                        "data": data
                    })
                except Exception:
                    pass

    def subscribe(self, websocket: WebSocket, symbol: str, exchange: str):
        """Subscribe a connection to symbol updates"""
        key = f"{exchange}:{symbol}"
        if key not in self.subscriptions:
            self.subscriptions[key] = set()
        self.subscriptions[key].add(websocket)
        logger.info(f"Subscribed to {key}")

    def unsubscribe(self, websocket: WebSocket, symbol: str, exchange: str):
        """Unsubscribe a connection from symbol updates"""
        key = f"{exchange}:{symbol}"
        if key in self.subscriptions:
            self.subscriptions[key].discard(websocket)
            if not self.subscriptions[key]:
                del self.subscriptions[key]


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "subscribe":
                symbol = data.get("symbol")
                exchange = data.get("exchange", "NSE")
                manager.subscribe(websocket, symbol, exchange)
                await websocket.send_json({
                    "type": "subscribed",
                    "symbol": symbol,
                    "exchange": exchange
                })

            elif action == "unsubscribe":
                symbol = data.get("symbol")
                exchange = data.get("exchange", "NSE")
                manager.unsubscribe(websocket, symbol, exchange)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "symbol": symbol,
                    "exchange": exchange
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def broadcast_execution_update(workflow_id: int, status: str, message: str):
    """Broadcast workflow execution updates"""
    await manager.broadcast({
        "type": "execution",
        "workflow_id": workflow_id,
        "status": status,
        "message": message
    })
