import os
import isodate
from googleapiclient.discovery import build
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")
if not API_KEY:
    raise ValueError("❌ YOUTUBE_API_KEY not found in .env file")

youtube = build('youtube', 'v3', developerKey=API_KEY)

def parse_duration(iso_duration):
    """Converts YouTube's ISO 8601 duration to seconds."""
    try:
        return int(isodate.parse_duration(iso_duration).total_seconds())
    except Exception:
        return 0

def get_videos_from_playlist(playlist_id: str) -> list[dict]:
    """
    Fetches all video details from a given YouTube Playlist ID.
    Returns a list of video data dictionaries.
    """
    print(f"Attempting to fetch videos for playlist: {playlist_id}")
    
    video_ids = []
    next_page_token = None

    # 1. Get all video IDs from the specified playlist
    try:
        while True:
            playlist_request = youtube.playlistItems().list(
                part="contentDetails",
                playlistId=playlist_id,
                maxResults=50, # Max allowed by API
                pageToken=next_page_token
            )
            playlist_response = playlist_request.execute()
            
            for item in playlist_response.get("items", []):
                video_ids.append(item["contentDetails"]["videoId"])
                
            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break # We've fetched all pages
                
    except Exception as e:
        print(f"❌ Error fetching playlist items: {e}")
        if "playlistNotFound" in str(e):
            raise ValueError("Playlist not found. Please check the ID.")
        return []
        
    print(f"Found {len(video_ids)} total videos in playlist.")
    if not video_ids:
        return []

    # 2. Get full details for all video IDs (in batches of 50)
    all_video_details = []
    for i in range(0, len(video_ids), 50):
        batch_ids = video_ids[i:i+50]
        
        try:
            video_request = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=",".join(batch_ids)
            )
            video_response = video_request.execute()
            
            for item in video_response.get("items", []):
                snippet = item["snippet"]
                details = item["contentDetails"]
                
                video_data = {
                    "title": snippet["title"],
                    "description": snippet.get("description", "")[:500],
                    "thumbnail_url": snippet["thumbnails"].get("high", {}).get("url"),
                    "video_url": item["id"], # This is the YouTube videoId
                    "duration": parse_duration(details["duration"]),
                    "views": int(item.get("statistics", {}).get("viewCount", 0)),
                }
                all_video_details.append(video_data)
                
        except Exception as e:
            print(f"❌ Error fetching video batch details: {e}")
            continue # Skip this batch on error
            
    print(f"Successfully fetched details for {len(all_video_details)} videos.")
    return all_video_details