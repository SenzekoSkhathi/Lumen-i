from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase
from security import get_admin_user # Import admin dependency

router = APIRouter(
    prefix="/api/storage",
    tags=["Storage"]
)

@router.post("/upload/{bucket}", dependencies=[Depends(get_admin_user)]) # Secure this
async def upload_file(bucket: str, file: UploadFile = File(...)):
    if bucket not in ["videos", "thumbnails", "profile_pics", "attachments"]:
        raise HTTPException(status_code=400, detail="Invalid bucket name")

    file_bytes = await file.read()

    file_path = f"{file.filename}"

    try:
        supabase.storage.from_(bucket).upload(
            file_path,
            file_bytes,
            {"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    url = supabase.storage.from_(bucket).get_public_url(file_path)
    return {"url": url}

# --- [NEW] DELETE FILE ENDPOINT ---

class DeleteRequest(BaseModel):
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

def get_filename_from_url(url: str, bucket: str) -> Optional[str]:
    """Helper to extract 'my-file.mp4' from a full Supabase URL"""
    if not url:
        return None
    try:
        # Splits the URL by the bucket name and takes the last part
        # e.g. .../storage/v1/object/public/videos/my-file.mp4
        # -> /my-file.mp4
        path = url.split(f"/{bucket}/")[-1]
        # Remove any query parameters (like ?t=...)
        return path.split("?")[0]
    except Exception:
        return None

@router.post("/delete", status_code=200, dependencies=[Depends(get_admin_user)])
async def delete_files(request: DeleteRequest):
    """
    Deletes video and/or thumbnail files from Supabase storage.
    This endpoint is called by the frontend *after* the video is
    deleted from the database.
    """
    deleted_files = []
    errors = []

    # --- Delete Video File ---
    video_filename = get_filename_from_url(request.video_url, "videos")
    if video_filename:
        try:
            supabase.storage.from_("videos").remove([video_filename])
            deleted_files.append(video_filename)
        except Exception as e:
            errors.append(f"Failed to delete video {video_filename}: {e}")

    # --- Delete Thumbnail File ---
    thumb_filename = get_filename_from_url(request.thumbnail_url, "thumbnails")
    if thumb_filename:
        try:
            supabase.storage.from_("thumbnails").remove([thumb_filename])
            deleted_files.append(thumb_filename)
        except Exception as e:
            errors.append(f"Failed to delete thumbnail {thumb_filename}: {e}")

    if errors:
        # Don't fail the whole request, just report errors
        return {"deleted": deleted_files, "errors": errors}

    return {"deleted": deleted_files, "errors": []}