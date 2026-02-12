import os
from pathlib import Path
from typing import List
from uuid import uuid4

try:
    import chromadb
    CHROMA_AVAILABLE = True
except Exception:
    chromadb = None
    CHROMA_AVAILABLE = False
import pypdf
import docx

from sqlmodel import Session, select

from database import engine
from models import ModuleMaterial
from vector_embeddings import generate_embeddings_for_texts, generate_embedding_for_text

CHROMA_DIR = Path(os.getenv("CHROMA_DIR", "chroma_store")).resolve()
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "module_materials")
FACULTY_UPLOAD_DIR = Path(
    os.getenv("FACULTY_UPLOAD_DIR", "faculty_uploads")
).resolve()


def get_collection():
    if not CHROMA_AVAILABLE:
        return None

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_or_create_collection(name=CHROMA_COLLECTION)


def read_text_from_file(path: Path) -> str:
    if not path.exists():
        return ""

    suffix = path.suffix.lower()
    try:
        if suffix == ".pdf":
            reader = pypdf.PdfReader(str(path))
            parts: List[str] = []
            for page in reader.pages:
                parts.append(page.extract_text() or "")
            return "\n".join(parts)

        if suffix == ".docx":
            document = docx.Document(str(path))
            return "\n".join([para.text for para in document.paragraphs])

        if suffix == ".txt":
            return path.read_text(encoding="utf-8", errors="replace")

        return ""
    except Exception:
        return ""


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    normalized = (text or "").strip()
    if not normalized:
        return []

    chunks: List[str] = []
    start = 0
    length = len(normalized)
    while start < length:
        end = min(start + chunk_size, length)
        chunks.append(normalized[start:end])
        if end == length:
            break
        start = max(0, end - overlap)

    return chunks


def delete_material_vectors(material_id: int) -> None:
    collection = get_collection()
    if not collection:
        return

    try:
        collection.delete(where={"material_id": material_id})
    except Exception:
        return


def ingest_material(material_id: int) -> None:
    if not CHROMA_AVAILABLE:
        return

    with Session(engine) as session:
        material = session.exec(
            select(ModuleMaterial).where(ModuleMaterial.id == material_id)
        ).first()

        if not material:
            return

        storage_path = FACULTY_UPLOAD_DIR / material.storage_filename
        text = read_text_from_file(storage_path)
        chunks = chunk_text(text)
        if not chunks:
            return

        delete_material_vectors(material_id)

        embeddings = generate_embeddings_for_texts(chunks)
        collection = get_collection()
        if not collection:
            return

        ids: List[str] = []
        metadatas: List[dict] = []
        documents: List[str] = []

        for index, chunk in enumerate(chunks):
            ids.append(f"{material_id}-{index}-{uuid4().hex}")
            metadatas.append(
                {
                    "module_id": material.module_id,
                    "material_id": material.id,
                    "tag": material.tag,
                    "source": material.original_filename,
                    "chunk_index": index,
                }
            )
            documents.append(chunk)

        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )


def query_module_chunks(query: str, module_id: int, limit: int = 5) -> tuple[List[str], List[dict]]:
    if not CHROMA_AVAILABLE:
        return [], []

    cleaned = (query or "").strip()
    if not cleaned:
        return [], []

    embedding = generate_embedding_for_text(cleaned)
    if not embedding:
        return [], []

    collection = get_collection()
    if not collection:
        return [], []
    results = collection.query(
        query_embeddings=[embedding],
        n_results=limit,
        where={"module_id": module_id},
        include=["documents", "metadatas"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    return documents or [], metadatas or []
