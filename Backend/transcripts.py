# transcripts.py

from typing import Optional
import re

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)


YOUTUBE_ID_REGEX = re.compile(
    r"(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})"
)


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extracts the 11-char YouTube video ID from common URL formats.
    """
    if not url:
        return None

    match = YOUTUBE_ID_REGEX.search(url)
    if match:
        return match.group(1)

    # If someone stores only the raw ID already
    if len(url) == 11 and all(c.isalnum() or c in "-_" for c in url):
        return url

    return None


def fetch_transcript_text(video_url: str) -> Optional[str]:
    """
    Fetches transcript for a YouTube video (any language, fallback).
    Returns full transcript text or None if unavailable.
    """
    video_id = extract_youtube_video_id(video_url)
    if not video_id:
        return None

    try:
        # Get the default transcript (or first available)
        segments = YouTubeTranscriptApi.get_transcript(video_id)
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        return None
    except Exception:
        return None

    # Join all caption segments into one big text
    lines = [seg.get("text", "").strip() for seg in segments if seg.get("text")]
    if not lines:
        return None

    transcript = " ".join(lines)
    # Optional: truncate if you ever want to limit length for embeddings
    return transcript
