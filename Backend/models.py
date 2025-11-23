# models.py

from sqlmodel import SQLModel, Field, JSON, Column, Relationship
from pydantic import EmailStr, BaseModel
from typing import Optional, List
from datetime import datetime, timezone # <--- Import specific class

# --- Timezone Helper ---
def utc_now():
    return datetime.now(timezone.utc)

# ================================
# USER TABLE
# ================================
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    full_name: str
    role: str
    hashed_password: str
    avatar_url: Optional[str] = None

    # FIX: Use 'datetime' directly, not 'datetime.datetime'
    created_at: datetime = Field(default_factory=utc_now)
    last_login: datetime = Field(default_factory=utc_now)

    # Relationships
    videos: List["Video"] = Relationship(back_populates="uploader")
    playlists: List["Playlist"] = Relationship(back_populates="creator")
    chats: List["ChatHistory"] = Relationship(back_populates="user")
    watch_history: List["WatchHistory"] = Relationship(back_populates="user")


# ================================
# VIDEO TABLE
# ================================
class Video(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    category: str = Field(index=True)
    duration: int = 0
    views: int = 0
    tutor_name: Optional[str] = None

    uploader_id: int = Field(foreign_key="user.id")

    transcript_text: Optional[str] = None

    # SQLite: Use JSON instead of pgvector
    embedding: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))

    uploader: "User" = Relationship(back_populates="videos")
    watch_history_entries: List["WatchHistory"] = Relationship(back_populates="video")


# ================================
# PLAYLIST TABLE
# ================================
class Playlist(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    tutor_name: Optional[str] = None

    video_ids: List[int] = Field(default_factory=list, sa_column=Column(JSON))

    creator_id: int = Field(foreign_key="user.id")
    creator: User = Relationship(back_populates="playlists")


# ================================
# CHAT
# ================================
class Message(SQLModel):
    role: str
    content: str
    timestamp: str


class ChatHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    # FIX: Use 'datetime' directly
    last_updated: datetime = Field(default_factory=utc_now)
    user_id: int = Field(foreign_key="user.id")
    messages: List[Message] = Field(default_factory=list, sa_column=Column(JSON))

    user: User = Relationship(back_populates="chats")


# ================================
# BROADCAST NOTIFICATION
# ================================
class BroadcastNotification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject: str
    message: str
    # FIX: Use 'datetime' directly
    created_at: datetime = Field(default_factory=utc_now)


# ================================
# WATCH HISTORY
# ================================
class WatchHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    video_id: int = Field(foreign_key="video.id")
    # FIX: Use 'datetime' directly
    watched_at: datetime = Field(default_factory=utc_now)

    user: User = Relationship(back_populates="watch_history")
    video: Video = Relationship(back_populates="watch_history_entries")


# ================================
# SCHEMAS
# ================================
class UserCreate(SQLModel):
    email: EmailStr
    password: str
    full_name: str
    role: str

class UserUpdate(SQLModel):
    full_name: str

class UserPublic(SQLModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None

class VideoPublic(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    category: str
    duration: int
    views: int
    tutor_name: Optional[str] = None

class VideoCreate(SQLModel):
    title: str
    description: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    category: str
    duration: int
    tutor_name: str

class VideoUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[int] = None
    tutor_name: Optional[str] = None

class PlaylistImportRequest(BaseModel):
    playlist_id: str
    category: str
    tutor_name: str

class ActiveUsersStat(BaseModel):
    active_users: int

class UserSignupStat(BaseModel):
    date: str
    count: int

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"