from typing import Dict, Set, Optional, List
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps appointment_id -> Set of connected WebSockets
        self.active_rooms: Dict[int, Set[WebSocket]] = {}
        # Maps appointment_id -> Dict of websocket -> { "email": str, "role": str }
        self.room_members: Dict[int, Dict[WebSocket, dict]] = {}
        # Global user tracking: email -> Set of WebSockets
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, appointment_id: int, websocket: WebSocket, email: str, role: str):
        await websocket.accept()

        if appointment_id not in self.active_rooms:
            self.active_rooms[appointment_id] = set()
            self.room_members[appointment_id] = {}

        self.active_rooms[appointment_id].add(websocket)
        self.room_members[appointment_id][websocket] = {"email": email, "role": role}

        if email not in self.user_connections:
            self.user_connections[email] = set()
        self.user_connections[email].add(websocket)

        # Broadcast to room that user joined
        online_roles = self.get_online_roles(appointment_id)
        await self.broadcast_to_room(
            appointment_id,
            {
                "type": "presence",
                "email": email,
                "role": role,
                "status": "online",
                "online_roles": online_roles,
            },
        )

    def disconnect(self, appointment_id: int, websocket: WebSocket, email: str, role: str):
        if appointment_id in self.active_rooms:
            self.active_rooms[appointment_id].discard(websocket)
            if websocket in self.room_members.get(appointment_id, {}):
                del self.room_members[appointment_id][websocket]

            if not self.active_rooms[appointment_id]:
                del self.active_rooms[appointment_id]
                if appointment_id in self.room_members:
                    del self.room_members[appointment_id]

        if email in self.user_connections:
            self.user_connections[email].discard(websocket)
            if not self.user_connections[email]:
                del self.user_connections[email]

    async def broadcast_to_room(self, appointment_id: int, message: dict, exclude: Optional[WebSocket] = None):
        if appointment_id not in self.active_rooms:
            return

        dead_sockets = []
        for ws in self.active_rooms[appointment_id]:
            if ws is not exclude:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending to WebSocket in room {appointment_id}: {e}")
                    dead_sockets.append(ws)

        for dead in dead_sockets:
            self.active_rooms[appointment_id].discard(dead)
            if appointment_id in self.room_members and dead in self.room_members[appointment_id]:
                del self.room_members[appointment_id][dead]

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Error sending personal message: {e}")

    def get_online_roles(self, appointment_id: int) -> List[str]:
        if appointment_id not in self.room_members:
            return []
        return list({info["role"] for info in self.room_members[appointment_id].values()})

    def is_role_online(self, appointment_id: int, role: str) -> bool:
        return role in self.get_online_roles(appointment_id)

    def is_user_online(self, email: str) -> bool:
        return bool(self.user_connections.get(email))


manager = ConnectionManager()
