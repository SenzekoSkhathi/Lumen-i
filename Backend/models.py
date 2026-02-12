# models.py

from sqlmodel import SQLModel, Field, JSON, Column, Relationship
from pydantic import EmailStr, BaseModel
from typing import Optional, List
from datetime import datetime, timezone # <--- Import specific class

# --- Timezone Helper ---
def utc_now():
    return datetime.now(timezone.utc)

# ================================
# INSTITUTION + MODULES
# ================================
class Institution(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=utc_now)

    users: List["User"] = Relationship(back_populates="institution")
    modules: List["Module"] = Relationship(back_populates="institution")


# ================================
# USER <-> MODULE LINK
# ================================
class UserModule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    module_id: int = Field(foreign_key="module.id")
    created_at: datetime = Field(default_factory=utc_now)

    user: "User" = Relationship(back_populates="module_links")
    module: "Module" = Relationship(back_populates="user_links")


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True)
    name: str
    system_prompt: Optional[str] = None
    institution_id: int = Field(foreign_key="institution.id")
    created_at: datetime = Field(default_factory=utc_now)

    institution: "Institution" = Relationship(back_populates="modules")
    users: List["User"] = Relationship(back_populates="modules", link_model=UserModule)
    user_links: List["UserModule"] = Relationship(back_populates="module")
    materials: List["ModuleMaterial"] = Relationship(back_populates="module")

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
    institution_id: Optional[int] = Field(default=None, foreign_key="institution.id")

    # FIX: Use 'datetime' directly, not 'datetime.datetime'
    created_at: datetime = Field(default_factory=utc_now)
    last_login: datetime = Field(default_factory=utc_now)

    # Relationships
    videos: List["Video"] = Relationship(back_populates="uploader")
    playlists: List["Playlist"] = Relationship(back_populates="creator")
    chats: List["ChatHistory"] = Relationship(back_populates="user")
    watch_history: List["WatchHistory"] = Relationship(back_populates="user")
    institution: Optional["Institution"] = Relationship(back_populates="users")
    modules: List["Module"] = Relationship(back_populates="users", link_model=UserModule)
    module_links: List["UserModule"] = Relationship(back_populates="user")


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
# HELP REQUESTS
# ================================
class HelpRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    module_id: Optional[int] = Field(default=None, foreign_key="module.id")
    message: str
    created_at: datetime = Field(default_factory=utc_now)

    user: "User" = Relationship()
    module: Optional["Module"] = Relationship()


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
# MODULE MATERIALS
# ================================
class ModuleMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    module_id: int = Field(foreign_key="module.id")
    uploader_id: int = Field(foreign_key="user.id")
    original_filename: str
    storage_filename: str
    content_type: str
    tag: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    module: "Module" = Relationship(back_populates="materials")
    uploader: "User" = Relationship()


# ================================
# SCHEMAS
# ================================
class UserCreate(SQLModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    institution_id: Optional[int] = None

class UserUpdate(SQLModel):
    full_name: str

class UserPublic(SQLModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    institution_id: Optional[int] = None
    avatar_url: Optional[str] = None

class ModulePublic(SQLModel):
    id: int
    code: str
    name: str
    system_prompt: Optional[str] = None
    institution_id: int

class ModuleMaterialPublic(SQLModel):
    id: int
    module_id: int
    uploader_id: int
    original_filename: str
    storage_filename: str
    content_type: str
    tag: str
    created_at: datetime
    updated_at: datetime

class HelpRequestPublic(SQLModel):
    id: int
    user_id: int
    module_id: Optional[int] = None
    message: str
    created_at: datetime

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