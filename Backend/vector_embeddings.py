# vector_embeddings.py

from typing import List, Optional
from sqlmodel import Session, select
from sentence_transformers import SentenceTransformer
import numpy as np

from models import Video

_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        # You can change the model name if you like
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def generate_embedding_for_text(text: str) -> List[float]:
    """
    Generate an embedding vector (as a Python list of floats) for any text.
    Stored as JSON in SQLite.
    """
    text = (text or "").strip()
    if not text:
        return []

    model = get_embedding_model()
    vec = model.encode([text])[0]  # shape (dim,)
    return vec.astype(float).tolist()


def generate_embeddings_for_texts(texts: List[str]) -> List[List[float]]:
    cleaned = [(text or "").strip() for text in texts]
    if not any(cleaned):
        return [[] for _ in cleaned]

    model = get_embedding_model()
    vectors = model.encode(cleaned)
    return [vec.astype(float).tolist() for vec in vectors]


def generate_embedding_for_video(video: Video, session: Session) -> None:
    """
    Generate and store an embedding for a specific Video row.
    Uses title + description (you can extend with transcript later).
    """
    parts = [video.title or ""]
    if video.description:
        parts.append(video.description)

    full_text = " ".join(parts).strip()
    if not full_text:
        video.embedding = None
    else:
        video.embedding = generate_embedding_for_text(full_text)

    session.add(video)
    session.commit()
    session.refresh(video)


def semantic_search_videos(
    session: Session,
    query_embedding: List[float],
    limit: int = 20,
) -> List[Video]:
    """
    Semantic search implemented in Python (cosine similarity) over
    JSON-stored embeddings in SQLite.
    """
    if not query_embedding:
        return []

    q = np.array(query_embedding, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return []

    videos = session.exec(
        select(Video).where(Video.embedding.is_not(None))
    ).all()

    scored: List[tuple[float, Video]] = []
    for v in videos:
        if not v.embedding:
            continue
        emb = np.array(v.embedding, dtype=np.float32)
        denom = np.linalg.norm(emb) * q_norm
        if denom == 0:
            continue
        sim = float(np.dot(q, emb) / denom)  # cosine similarity
        scored.append((sim, v))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_videos = [v for sim, v in scored[:limit]]
    return top_videos

