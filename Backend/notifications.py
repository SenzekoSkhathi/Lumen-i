# In notifications.py (NEW FILE)

from typing import List
from fastapi import WebSocket, WebSocketDisconnect

class NotificationManager:
    """Manages all active WebSocket connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New connection. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection."""
        self.active_connections.remove(websocket)
        print(f"Connection closed. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        """Sends a plain text message to all connected clients."""
        print(f"Broadcasting message to {len(self.active_connections)} clients: {message}")
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                # Handle cases where client disconnected abruptly
                self.disconnect(connection)
            except Exception as e:
                # Log other potential errors
                print(f"Error sending to client: {e}")

# Create a single, shared instance of the manager
notification_manager = NotificationManager()