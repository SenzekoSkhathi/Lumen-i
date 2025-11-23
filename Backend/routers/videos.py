from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlmodel import Session, select, func, or_, SQLModel
from typing import List, Optional
import os
import shutil
import datetime 

from database import get_db
from models import (
    Video, VideoPublic, User,
    Playlist, WatchHistory, 
    VideoCreate, VideoUpdate 
)
# Import these inside the function or safely to prevent import crashes
from security import get_current_user, get_admin_user 

# Try importing these safely
try:
    from vector_embeddings import generate_embedding_for_video
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    print("⚠️ Vector embeddings library missing. Semantic search will be disabled.")
    EMBEDDINGS_AVAILABLE = False

try:
    from transcripts import fetch_transcript_text 
except ImportError:
    print("⚠️ Transcript library missing.")
    def fetch_transcript_text(url): return None

router = APIRouter(prefix="/api/videos", tags=["Videos"])


# ============================
# [NEW] ADMIN: Get my videos
# ============================
@router.get("/my-videos", response_model=List[VideoPublic], dependencies=[Depends(get_admin_user)])
def get_my_uploaded_videos(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    videos = session.exec(
        select(Video)
        .where(Video.uploader_id == user.id)
        .order_by(Video.id.desc())
    ).all()
    return [VideoPublic.model_validate(v) for v in videos]


# ============================
# [NEW] ADMIN: Upload video
# ============================
@router.post("/upload", response_model=VideoPublic, dependencies=[Depends(get_admin_user)])
def upload_video(
    video_data: VideoCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """
    Allows an admin to add a new single video.
    """
    print(f"📝 Processing upload for: {video_data.title} (ID: {video_data.video_url})")

    # 1. SAFE TRANSCRIPT FETCHING
    transcript = None
    try:
        # Only attempt if we have a valid-looking ID or URL
        if video_data.video_url and len(video_data.video_url) > 5:
            transcript = fetch_transcript_text(video_data.video_url)
    except Exception as e:
        print(f"⚠️ Warning: Could not fetch transcript: {e}")
        # Continue without transcript - DO NOT CRASH

    # 2. SAVE TO DATABASE
    try:
        new_video = Video.model_validate(video_data)
        new_video.uploader_id = user.id
        new_video.transcript_text = transcript
        new_video.views = 0 

        session.add(new_video)
        session.commit()
        session.refresh(new_video)
    except Exception as e:
        print(f"❌ Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database error while saving video.")

    # 3. SAFE EMBEDDING GENERATION
    # This is the most likely cause of hard crashes (OOM or DLL errors)
    if EMBEDDINGS_AVAILABLE:
        try:
            print("🧠 Generating AI embeddings...")
            generate_embedding_for_video(new_video, session)
            print("✅ Embeddings generated.")
        except Exception as e:
            print(f"⚠️ Failed to generate embedding (skipping): {e}")
            # Continue - the video is already saved, so we return success

    return VideoPublic.model_validate(new_video)


# ============================
# [NEW] ADMIN: Update video
# ============================
@router.put("/{video_id}", response_model=VideoPublic, dependencies=[Depends(get_admin_user)])
def update_video(
    video_id: int,
    video_data: VideoUpdate,
    session: Session = Depends(get_db)
):
    video = session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    update_data = video_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(video, key, value)
    
    session.add(video)
    session.commit()
    session.refresh(video)

    # Re-generate embedding safely
    if EMBEDDINGS_AVAILABLE:
        try:
            generate_embedding_for_video(video, session)
        except Exception as e:
            print(f"⚠️ Failed to update embedding: {e}")

    return VideoPublic.model_validate(video)


# ============================
# [NEW] ADMIN: Delete video
# ============================
@router.delete("/{video_id}", status_code=204, dependencies=[Depends(get_admin_user)])
def delete_video(
    video_id: int,
    session: Session = Depends(get_db)
):
    video = session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    history_entries = session.exec(
        select(WatchHistory).where(WatchHistory.video_id == video_id)
    ).all()
    for entry in history_entries:
        session.delete(entry)
    
    session.delete(video)
    session.commit()
    return


# ============================
# PAGINATION + FILTERING
# ============================
class PaginatedVideos(SQLModel):
    items: List[VideoPublic]
    total: int
    page: int
    page_size: int
    total_pages: int 


@router.get("/browse", response_model=PaginatedVideos)
def browse_videos(
    page: int = Query(1, gt=0),
    page_size: int = Query(24, gt=0, le=1000),
    category: Optional[str] = Query(None),
    tutor_name: Optional[str] = Query(default=None),
    search: Optional[str] = Query(None),
    order_by: str = Query("newest"),
    session: Session = Depends(get_db),
):
    stmt = select(Video)

    if category:
        stmt = stmt.where(Video.category == category)

    if tutor_name:
        normalized = tutor_name.strip()
        stmt = stmt.where(func.lower(Video.tutor_name) == func.lower(normalized))

    if search:
        term = f"%{search}%"
        stmt = stmt.where(
            or_(Video.title.ilike(term), Video.description.ilike(term))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    if order_by == "newest":
        stmt = stmt.order_by(Video.id.desc())
    elif order_by == "views":
        stmt = stmt.order_by(Video.views.desc())
    elif order_by == "duration":
        stmt = stmt.order_by(Video.duration.desc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    videos = session.exec(stmt).all()

    return PaginatedVideos(
        items=[VideoPublic.model_validate(v) for v in videos],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


# ============================
# SINGLE VIDEO
# ============================
@router.get("/{video_id}", response_model=VideoPublic)
def get_video(video_id: int, session: Session = Depends(get_db)):
    v = session.get(Video, video_id)
    if not v:
        raise HTTPException(404, "Video not found")
    
    # Simple increment without crashing
    try:
        v.views += 1
        session.add(v) 
        session.commit()
        session.refresh(v)
    except Exception:
        pass 

    return VideoPublic.model_validate(v)


# ============================
# WATCH HISTORY
# ============================
@router.post("/{video_id}/view")
def record_video_view(
    video_id: int, 
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_db)
):
    if not session.get(Video, video_id):
        raise HTTPException(404, "Video not found")

    statement = select(WatchHistory).where(
        WatchHistory.user_id == user.id,
        WatchHistory.video_id == video_id
    )
    existing_entry = session.exec(statement).first()
    
    try:
        if existing_entry:
            existing_entry.watched_at = datetime.datetime.utcnow()
            session.add(existing_entry)
        else:
            wh = WatchHistory(user_id=user.id, video_id=video_id)
            session.add(wh)
        
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving history: {e}")

    return {"message": "Watch recorded"}


# ============================
# TUTOR STATS & TOP VIDEOS
# ============================
class TutorStats(SQLModel):
    tutor_name: str
    video_count: int
    total_views: int
    total_watch_events: int
    avg_duration: float

@router.get("/tutors/{tutor_name}/stats", response_model=TutorStats)
def tutor_stats(tutor_name: str, session: Session = Depends(get_db)):
    v_stmt = select(
        func.count(Video.id),
        func.coalesce(func.sum(Video.views), 0),
        func.coalesce(func.avg(Video.duration), 0)
    ).where(Video.tutor_name == tutor_name)

    video_count, total_views, avg_duration = session.exec(v_stmt).one()

    wh_stmt = (
        select(func.count(WatchHistory.id))
        .join(Video, Video.id == WatchHistory.video_id)
        .where(Video.tutor_name == tutor_name)
    )
    total_watch_events = session.exec(wh_stmt).one()

    return TutorStats(
        tutor_name=tutor_name,
        video_count=video_count,
        total_views=total_views,
        total_watch_events=total_watch_events,
        avg_duration=float(avg_duration),
    )

@router.get("/tutors/{tutor_name}/top", response_model=List[VideoPublic])
def tutor_top(tutor_name: str, session: Session = Depends(get_db), limit: int = 10):
    stmt = (
        select(Video)
        .where(Video.tutor_name == tutor_name)
        .order_by(Video.views.desc())
        .limit(limit)
    )
    vids = session.exec(stmt).all()
    return [VideoPublic.model_validate(v) for v in vids]