# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware 
import uvicorn
from contextlib import asynccontextmanager
import os

from routers import auth, chat, videos, admin, notifications, playlists, storage, watch_history
from database import create_db_and_tables
from notifications import notification_manager
from search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="Lumeni API",
    version="0.6.0",
    lifespan=lifespan
)

# --- Security Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-secret-change-in-production")
if SECRET_KEY == "fallback-insecure-secret-change-in-production":
    print("⚠️  WARNING: Using fallback secret key. Set SECRET_KEY in .env for production.")

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Specific origins for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SessionMiddleware with proper secret
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# --- Routers ---
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(videos.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(playlists.router)
app.include_router(storage.router)
app.include_router(watch_history.router)
app.include_router(search_router)

# --- WebSocket ---
@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await notification_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        notification_manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Lumeni API!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.6.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)