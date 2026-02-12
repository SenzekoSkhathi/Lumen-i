# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware 
import uvicorn
from contextlib import asynccontextmanager
import os

from routers import auth, chat, videos, admin, notifications, playlists, storage, watch_history, faculty, modules, help_requests
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
# [FIX] Updated origins list to include your Vercel frontend
origins = [
    "http://localhost:5173",        # Localhost (Laptop)
    "http://127.0.0.1:5173",        # Localhost (Laptop alternative)
    "https://lumen-i.vercel.app",   # Your Vercel Frontend
    "https://lumen-i.vercel.app/",  # Your Vercel Frontend (with slash)
    os.getenv("FRONTEND_URL")       # Flexible variable from Render settings
]

# Filter out None values just in case the env var isn't set
origins = [origin for origin in origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Use the updated list
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
app.include_router(faculty.router)
app.include_router(modules.router)
app.include_router(help_requests.router)
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
    # Respect platform-assigned port when running directly.
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)