# search.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_db
from models import Video, VideoPublic
from vector_embeddings import (
    generate_embedding_for_text,
    semantic_search_videos,
)

router = APIRouter(prefix="/api/search", tags=["Search"])


# ---------- 1. Autocomplete (YouTube-style) ----------
@router.get("/suggest", response_model=List[str])
def suggest_queries(
    q: str = Query(..., min_length=1),
    session: Session = Depends(get_db),
):
    stmt = (
        select(Video.title)
        .where(Video.title.ilike(f"%{q}%"))
        .limit(10)
    )
    results = session.exec(stmt).all()
    # results is list of tuples -> flatten
    return [title for (title,) in results]


# ---------- 2. Semantic Search for Videos ----------
@router.get("/videos", response_model=List[VideoPublic])
def search_videos(
    q: str = Query(..., min_length=1),
    session: Session = Depends(get_db),
):
    q = q.strip()
    if not q:
        return []

    # Step 1: Try semantic search
    try:
        query_embedding = generate_embedding_for_text(q)
        semantic_results = semantic_search_videos(
            session=session,
            query_embedding=query_embedding,
            limit=20,
        )
        if semantic_results:
            # [FIX] Use model_validate for Pydantic V2/SQLModel compatibility
            return [VideoPublic.model_validate(v) for v in semantic_results]
    except Exception as e:
        # Don't crash search if embeddings fail
        print("Semantic search failed:", e)

    # Step 2: Fallback — keyword search
    fallback_stmt = (
        select(Video)
        .where(Video.title.ilike(f"%{q}%"))
        .limit(20)
    )
    fallback_results = session.exec(fallback_stmt).all()
    # [FIX] Use model_validate here as well
    return [VideoPublic.model_validate(v) for v in fallback_results]