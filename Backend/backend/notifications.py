from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()
clients: List[WebSocket] = []

@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)

async def send_notification(message: str):
    payload = {"text": message, "time": "Just now"}
    for ws in clients:
        try:
            await ws.send_json(payload)
        except Exception:
            pass
