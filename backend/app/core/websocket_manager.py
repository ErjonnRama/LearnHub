from typing import Dict, List
from fastapi import WebSocket
import json
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time chat and notifications."""

    def __init__(self):
        # room_id -> list of (websocket, user_id)
        self.chat_rooms: Dict[int, List[tuple]] = {}
        # user_id -> websocket (for notifications)
        self.user_connections: Dict[int, WebSocket] = {}

    async def connect_chat(self, websocket: WebSocket, room_id: int, user_id: int):
        await websocket.accept()
        if room_id not in self.chat_rooms:
            self.chat_rooms[room_id] = []
        self.chat_rooms[room_id].append((websocket, user_id))

    def disconnect_chat(self, websocket: WebSocket, room_id: int):
        if room_id in self.chat_rooms:
            self.chat_rooms[room_id] = [
                (ws, uid) for ws, uid in self.chat_rooms[room_id] if ws != websocket
            ]

    async def broadcast_to_room(self, room_id: int, message: dict):
        if room_id in self.chat_rooms:
            dead = []
            for ws, uid in self.chat_rooms[room_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead.append((ws, uid))
            for d in dead:
                self.chat_rooms[room_id].remove(d)

    async def connect_notifications(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.user_connections[user_id] = websocket

    def disconnect_notifications(self, user_id: int):
        self.user_connections.pop(user_id, None)

    async def send_notification(self, user_id: int, notification: dict):
        ws = self.user_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(notification))
            except Exception:
                self.disconnect_notifications(user_id)

    async def broadcast_notification(self, notification: dict):
        dead = []
        for uid, ws in self.user_connections.items():
            try:
                await ws.send_text(json.dumps(notification))
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect_notifications(uid)

    def get_room_users(self, room_id: int) -> List[int]:
        return [uid for _, uid in self.chat_rooms.get(room_id, [])]

    def get_online_users(self) -> List[int]:
        return list(self.user_connections.keys())


manager = ConnectionManager()
