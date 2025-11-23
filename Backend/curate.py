import os
import isodate # For parsing video durations
from googleapiclient.discovery import build
from sqlmodel import Session, select
from dotenv import load_dotenv

# Import your models and db engine from your existing files
from models import Video, User 
from database import engine

# --- CONFIGURATION ---
load_dotenv()
# We use the specific key you created
API_KEY = os.getenv("YOUTUBE_API_KEY") 
if not API_KEY:
    raise ValueError("❌ YOUTUBE_API_KEY not found in .env file")

# Use the official Google API client
youtube = build('youtube', 'v3', developerKey=API_KEY)

# Define your trusted sources and topics to search for.
# Feel free to change these queries or add more!
# Channel IDs:
# Khan Academy: UC4a-Gbdw7vKqNzwS-RjLAoQ
# MIT OpenCourseWare: UC_783-iVp0zXG1F-N-R-Yg
# Crash Course: UCHd-w3-l3Kqkl3PC-1j2-wQ
# TED-Ed: UCsooa4yRKGN_zEE8iknghZA

CURATION_LIST = [
    {
        "query": "calculus 1",
        "channel_id": "UC4a-Gbdw7vKqNzwS-RjLAoQ", # Khan Academy
        "category": "Mathematics"
    },
    {
        "query": "python programming for beginners",
        "channel_id": "UC_783-iVp0zXG1F-N-R-Yg", # MIT OCW
        "category": "Computer Science"
    },
    {
        "query": "organic chemistry",
        "channel_id": "UCHd-w3-l3Kqkl3PC-1j2-wQ", # Crash Course
        "category": "Chemistry"
    },
    {
        "query": "supply and demand",
        "channel_id": "UCsooa4yRKGN_zEE8iknghZA", # TED-Ed
        "category": "Business"
    }
]

def parse_duration(iso_duration):
    """Converts YouTube's ISO 8601 duration to seconds."""
    # Example: "PT10M30S" -> 630 seconds
    return int(isodate.parse_duration(iso_duration).total_seconds())

def get_admin_user_id(session: Session) -> int:
    """
    Finds the FIRST user with the 'admin' role to assign videos to.
    """
    statement = select(User).where(User.role == "admin")
    admin = session.exec(statement).first()
    
    if not admin:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("⚠️ ERROR: No 'admin' user found in your database.")
        print("Please run the 'create_admin.py' script first.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        raise Exception("No admin user found.")
    
    print(f"Found admin user: {admin.full_name} (ID: {admin.id})")
    return admin.id

def search_and_populate():
    """
    Main function to search YouTube and fill our database.
    """
    print("🚀 Starting video curation script...")
    
    with Session(engine) as session:
        # Get the admin user to "own" these videos
        uploader_id = get_admin_user_id(session)

        for item in CURATION_LIST:
            print(f"Searching for: '{item['query']}' in category '{item['category']}'...")
            
            # 1. Search for videos (search.list)
            search_request = youtube.search().list(
                part="snippet",
                q=item['query'],
                channelId=item['channel_id'],
                type="video",
                videoCategoryId="27", # "27" is Education
                maxResults=5 # Get 5 videos per query
            )
            search_response = search_request.execute()
            
            video_ids = []
            for search_result in search_response.get("items", []):
                video_ids.append(search_result["id"]["videoId"])

            if not video_ids:
                print("  No videos found for this query.")
                continue

            # 2. Get full video details (videos.list)
            # This gets us the duration and view count
            video_request = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=",".join(video_ids) # Pass all IDs at once
            )
            video_response = video_request.execute()

            # 3. Add to our database
            for video_item in video_response.get("items", []):
                snippet = video_item["snippet"]
                details = video_item["contentDetails"]
                
                # Create a new Video object based on our SQLModel
                new_video = Video(
                    title=snippet["title"],
                    description=snippet.get("description", "")[:500], # Truncate description
                    thumbnail_url=snippet["thumbnails"].get("high", {}).get("url"),
                    video_url=video_item["id"], # Store the YouTube videoId here
                    category=item["category"],
                    duration=parse_duration(details["duration"]),
                    views=int(video_item.get("statistics", {}).get("viewCount", 0)),
                    uploader_id=uploader_id
                )
                
                # Check if we already have this video
                existing = session.exec(select(Video).where(Video.video_url == new_video.video_url)).first()
                if not existing:
                    session.add(new_video)
                    print(f"  ✅ Added: {new_video.title}")
                else:
                    print(f"  ⏩ Skipping (already exists): {new_video.title}")

        session.commit()
    print("🎉 Curation complete! Your database is now populated with videos.")

if __name__ == "__main__":
    search_and_populate()