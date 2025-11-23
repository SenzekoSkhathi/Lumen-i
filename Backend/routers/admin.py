from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from database import get_db
import models, security, youtube_utils 
from models import (
    UserCreate, UserPublic, PlaylistImportRequest, 
    ActiveUsersStat, UserSignupStat, BroadcastNotification
)

# Import the notification manager to send real-time updates
try:
    from notifications import notification_manager
except ImportError:
    print("⚠️ Could not import notification_manager in admin.py")
    notification_manager = None

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(security.get_admin_user)],
)

# --- Pydantic Schemas ---
class BroadcastRequest(BaseModel):
    subject: str
    message: str

class BroadcastUpdate(BaseModel):
    subject: str
    message: str

# --- Admin User Management ---

@router.get("/users", response_model=List[UserPublic])
def get_all_users(
    role: Optional[str] = Query(None, description="Filter users by role (e.g., 'admin' or 'student')"),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    users = query.all()
    return users

@router.put("/users/{user_id}/promote", response_model=UserPublic)
def promote_user_to_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/demote", response_model=UserPublic)
def demote_user_to_student(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "student"
    db.commit()
    db.refresh(user)
    return user

@router.post("/create-admin", response_model=UserPublic, status_code=201)
def create_admin_user(
    user: UserCreate, db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.hash_password(user.password)
    new_admin = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role="admin",
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin


# --- Broadcast Notifications ---

@router.post("/broadcast", response_model=BroadcastNotification, status_code=201)
async def send_broadcast(
    request: BroadcastRequest,
    db: Session = Depends(get_db)
):
    # 1. Save to Database
    new_notification = BroadcastNotification(
        subject=request.subject,
        message=request.message
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    # 2. Send Real-time Update via WebSocket
    if notification_manager:
        await notification_manager.broadcast({
            "id": new_notification.id,
            "subject": new_notification.subject,
            "message": new_notification.message,
            "created_at": new_notification.created_at.isoformat()
        })
    
    return new_notification

@router.put("/broadcasts/{id}", response_model=BroadcastNotification)
def update_broadcast(
    id: int,
    update_data: BroadcastUpdate,
    db: Session = Depends(get_db)
):
    notification = db.get(BroadcastNotification, id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Server-side 15-minute validation
    now = datetime.now(timezone.utc)
    # Ensure timezone awareness for comparison
    created_at = notification.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
        
    if now - created_at > timedelta(minutes=15):
        raise HTTPException(status_code=403, detail="Cannot edit broadcasts older than 15 minutes")

    notification.subject = update_data.subject
    notification.message = update_data.message
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/broadcasts/{id}", status_code=204)
def delete_broadcast(
    id: int,
    db: Session = Depends(get_db)
):
    notification = db.get(BroadcastNotification, id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return


# --- YouTube Playlist Importer ---

@router.post("/import-playlist")
def import_youtube_playlist(
    request: PlaylistImportRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(security.get_admin_user),
):
    try:
        videos_data = youtube_utils.get_videos_from_playlist(
            request.playlist_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch playlist from YouTube: {str(e)}"
        )

    added_count = 0
    for video_data in videos_data:
        exists = (
            db.query(models.Video)
            .filter(models.Video.video_url == video_data["video_url"])
            .first()
        )
        if not exists:
            new_video = models.Video(
                title=video_data["title"],
                description=video_data["description"],
                video_url=video_data["video_url"],
                thumbnail_url=video_data["thumbnail_url"],
                duration=video_data["duration"],
                category=request.category,
                tutor_name=request.tutor_name,
                uploader_id=admin.id,
            )
            db.add(new_video)
            added_count += 1

    db.commit()
    return {
        "message": f"Successfully imported {added_count} new videos out of {len(videos_data)} total."
    }


# --- Dashboard Statistics Routes ---

@router.get("/stats/active_users", response_model=ActiveUsersStat)
def get_active_users(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_user_count = (
        db.query(func.count(func.distinct(models.WatchHistory.user_id)))
        .filter(models.WatchHistory.watched_at >= thirty_days_ago)
        .scalar()
    )
    return {"active_users": active_user_count or 0}


@router.get("/stats/user_signups", response_model=List[UserSignupStat])
def get_user_signups_stats(days: int = 7, db: Session = Depends(get_db)):
    if days <= 0:
        raise HTTPException(status_code=400, detail="'days' must be a positive integer.")
        
    start_date = datetime.utcnow().date() - timedelta(days=days - 1)
    
    signup_counts = (
        db.query(
            func.date(models.User.created_at).label("date"),
            func.count(models.User.id).label("count"),
        )
        .filter(models.User.created_at >= start_date)
        .group_by(func.date(models.User.created_at))
        .order_by(func.date(models.User.created_at))
        .all()
    )
    
    counts_map = {str(date): count for date, count in signup_counts}
    results = []
    for i in range(days):
        date_str = (start_date + timedelta(days=i)).isoformat()
        count = counts_map.get(date_str, 0)
        results.append({"date": date_str, "count": count})
        
    return results