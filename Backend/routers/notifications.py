# In routers/notifications.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from database import get_db
from models import BroadcastNotification, User
from security import get_current_user # We need this to protect the route

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
    dependencies=[Depends(get_current_user)] # Only logged-in users can see
)

@router.get("/broadcasts", response_model=List[BroadcastNotification])
def get_all_broadcasts(session: Session = Depends(get_db)):
    """
    Gets the 20 most recent broadcast notifications.
    """
    statement = select(BroadcastNotification).order_by(
        BroadcastNotification.created_at.desc() # Get newest first
    ).limit(20)
    
    notifications = session.exec(statement).all()
    
    # We reverse them so the frontend gets them oldest-to-newest
    return notifications[::-1]

# --- [NEW ENDPOINT ADDED] ---
@router.get("/{broadcast_id}", response_model=BroadcastNotification)
def get_single_broadcast(
    broadcast_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Ensures user is logged in
):
    """
    Gets a single broadcast notification by its ID.
    """
    notification = session.get(BroadcastNotification, broadcast_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return notification