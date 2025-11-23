# In routers/watch_history.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from typing import List, Optional
import datetime

from database import get_db
from models import User, Video, WatchHistory
from security import get_current_user

router = APIRouter(
    prefix="/api/history",
    tags=["Watch History"],
    dependencies=[Depends(get_current_user)] # All routes here require login
)

# This is the Pydantic model the frontend will receive
class HistoryVideo(SQLModel):
    id: int
    title: str
    thumbnail_url: Optional[str]
    tutor_name: Optional[str]
    views: int
    duration: int
    watched_at: datetime.datetime


@router.get("/", response_model=List[HistoryVideo])
def get_watch_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
    limit: Optional[int] = None
):
    """
    Gets the current user's watch history, newest first.
    Optionally pass ?limit=5 to get the 5 most recent.
    """
    statement = (
        select(WatchHistory, Video)
        .join(Video)
        .where(WatchHistory.user_id == current_user.id)
        .order_by(WatchHistory.watched_at.desc())
    )
    
    if limit:
        statement = statement.limit(limit)
        
    results = session.exec(statement).all()
    
    # Format the data into the HistoryVideo model
    history_list = []
    for history_entry, video in results:
        history_list.append(
            HistoryVideo(
                id=video.id,
                title=video.title,
                thumbnail_url=video.thumbnail_url,
                tutor_name=video.tutor_name,
                views=video.views,
                duration=video.duration,
                watched_at=history_entry.watched_at
            )
        )
    
    return history_list


@router.post("/{video_id}", status_code=status.HTTP_201_CREATED)
def add_to_watch_history(
    video_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """
    Adds a video to the user's history.
    If it already exists, it updates the timestamp.
    """
    
    # Check if the video exists first
    video = session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if an entry *already exists*
    statement = select(WatchHistory).where(
        WatchHistory.user_id == current_user.id,
        WatchHistory.video_id == video_id
    )
    existing_entry = session.exec(statement).first()
    
    try:
        if existing_entry:
            # It exists, just update the timestamp to move it to the top
            existing_entry.watched_at = datetime.datetime.now()
            session.add(existing_entry)
        else:
            # It's a new entry
            new_history_entry = WatchHistory(
                user_id=current_user.id,
                video_id=video_id
            )
            session.add(new_history_entry)
            
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving history: {e}")

    return {"message": "Watch history updated"}


# --- 1. ADD NEW ENDPOINT TO CLEAR HISTORY ---
@router.delete("/clear-all", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_watch_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """
    Deletes all watch history entries for the current user.
    """
    
    # Find all history items for the user
    statement = select(WatchHistory).where(WatchHistory.user_id == current_user.id)
    history_items = session.exec(statement).all()
    
    if not history_items:
        return # Nothing to delete, return success

    try:
        # Delete all found items
        for item in history_items:
            session.delete(item)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error clearing history: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing history: {e}")
    
    return # Returns 204 No Content