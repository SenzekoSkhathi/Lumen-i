from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel, col
from typing import List, Optional

from database import get_db
from models import User, Video, Playlist
from security import get_admin_user, get_current_user

router = APIRouter(
    prefix="/api/playlists",
    tags=["Playlists"]
)

# --- Pydantic Models ---

class PlaylistCreate(SQLModel):
    name: str
    description: Optional[str] = None
    tutor_name: str

class PlaylistPublic(PlaylistCreate):
    id: int
    video_count: int
    thumbnail_url: Optional[str] = None

class AddVideoToPlaylist(SQLModel):
    video_ids: List[int]


# --- Helper to fetch thumbnails efficiently ---
def populate_playlist_thumbnails(session: Session, playlists: List[Playlist]) -> List[PlaylistPublic]:
    """
    Optimized helper to fetch all first-video thumbnails in one query.
    """
    # 1. Collect all the "first video IDs" from the playlists
    first_video_ids = []
    for pl in playlists:
        if pl.video_ids:
            first_video_ids.append(pl.video_ids[0])
    
    # 2. Fetch all needed videos in a SINGLE query (Performance Fix)
    video_map = {}
    if first_video_ids:
        videos = session.exec(
            select(Video).where(col(Video.id).in_(first_video_ids))
        ).all()
        # Create a lookup dictionary: {video_id: thumbnail_url}
        video_map = {v.id: v.thumbnail_url for v in videos}

    # 3. Build the public response objects
    public_playlists = []
    for pl in playlists:
        thumb = None
        if pl.video_ids and pl.video_ids[0] in video_map:
            thumb = video_map[pl.video_ids[0]]

        public_playlists.append(
            PlaylistPublic(
                id=pl.id,
                name=pl.name,
                description=pl.description,
                tutor_name=pl.tutor_name,
                video_count=len(pl.video_ids),
                thumbnail_url=thumb
            )
        )
    return public_playlists


# =====================================================
# 🔥 ADMIN ENDPOINT
# =====================================================

@router.get("/all-admin", response_model=List[PlaylistPublic], dependencies=[Depends(get_admin_user)])
def get_all_playlists_admin(session: Session = Depends(get_db)):
    playlists = session.exec(select(Playlist)).all()
    return populate_playlist_thumbnails(session, playlists)


# =====================================================
# PUBLIC ENDPOINTS
# =====================================================

@router.get("/by-tutor/{tutor_name}", response_model=List[PlaylistPublic])
def get_playlists_by_tutor(tutor_name: str, session: Session = Depends(get_db)):
    playlists = session.exec(select(Playlist).where(Playlist.tutor_name == tutor_name)).all()
    return populate_playlist_thumbnails(session, playlists)


# =====================================================
# SINGLE PLAYLIST ROUTES
# =====================================================

@router.get("/{playlist_id}", response_model=PlaylistPublic)
def get_playlist_details(playlist_id: int, session: Session = Depends(get_db)):
    pl = session.get(Playlist, playlist_id)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")

    thumbnail = None
    if pl.video_ids:
        first_video = session.get(Video, pl.video_ids[0])
        if first_video:
            thumbnail = first_video.thumbnail_url

    return PlaylistPublic(
        id=pl.id,
        name=pl.name,
        description=pl.description,
        tutor_name=pl.tutor_name,
        video_count=len(pl.video_ids),
        thumbnail_url=thumbnail
    )


@router.get("/{playlist_id}/videos", response_model=List[dict])
def get_videos_in_playlist(playlist_id: int, session: Session = Depends(get_db)):
    playlist = session.get(Playlist, playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Optimization: Fetch all videos in the list in one query
    if not playlist.video_ids:
        return []

    videos = session.exec(
        select(Video).where(col(Video.id).in_(playlist.video_ids))
    ).all()

    # Sort them to match the order in playlist.video_ids
    video_map = {v.id: v for v in videos}
    ordered_videos = []
    for vid_id in playlist.video_ids:
        if vid_id in video_map:
            ordered_videos.append(video_map[vid_id].model_dump())

    return ordered_videos


# =====================================================
# ADMIN ADD/CREATE
# =====================================================

@router.post("/create", response_model=Playlist, dependencies=[Depends(get_admin_user)])
def create_playlist(playlist_data: PlaylistCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_db)):
    new_playlist = Playlist(
        name=playlist_data.name,
        description=playlist_data.description,
        tutor_name=playlist_data.tutor_name,
        creator_id=current_user.id
    )
    session.add(new_playlist)
    session.commit()
    session.refresh(new_playlist)
    return new_playlist


@router.put("/{playlist_id}/add-video", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_admin_user)])
def add_video_to_playlist(playlist_id: int, video_data: AddVideoToPlaylist, session: Session = Depends(get_db)):
    playlist = session.get(Playlist, playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    updated_ids = list(playlist.video_ids)
    videos_added = 0

    for video_id in video_data.video_ids:
        video = session.get(Video, video_id)
        if video and video.id not in updated_ids:
            updated_ids.append(video.id)
            videos_added += 1

    if videos_added > 0:
        playlist.video_ids = updated_ids
        session.add(playlist)
        session.commit()

    return