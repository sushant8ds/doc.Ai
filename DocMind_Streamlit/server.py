"""
DocMind AI — FastAPI Backend Server
Wraps the existing core modules to serve the React frontend.
Run with: python3 -m uvicorn server:app --reload --port 8000
"""

import os
import sys
import tempfile
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="DocMind AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session state (single-user local app)
_session: dict = {
    "index": None,
    "chunks": None,
    "chunk_pages": None,   # list[int] — page number (1-based) for each chunk
    "full_text": "",
    "history": [],
}


def _extract_pdf_with_pages(file_path: str):
    """
    Extract text per page from a PDF.
    Returns (full_text, page_texts) where page_texts is list[str] indexed by page.
    """
    import fitz
    page_texts = []
    full_text = ""
    doc = fitz.open(file_path)
    for page in doc:
        t = page.get_text()
        page_texts.append(t)
        full_text += t
    doc.close()
    return full_text.strip(), page_texts


def _chunk_with_pages(page_texts: list, chunk_size: int = 500, overlap: int = 50):
    """
    Chunk text while tracking which page each chunk originates from.
    Returns (chunks, chunk_pages) — parallel lists.
    """
    chunks = []
    chunk_pages = []

    # Build a flat list of (char, page_number) pairs
    char_page = []
    for page_num, text in enumerate(page_texts, start=1):
        for ch in text:
            char_page.append((ch, page_num))

    full_text = "".join(c for c, _ in char_page)
    step = chunk_size - overlap

    for i in range(0, len(full_text), step):
        chunk = full_text[i: i + chunk_size]
        if chunk.strip():
            chunks.append(chunk)
            # Page = page of the first character of this chunk
            chunk_pages.append(char_page[i][1])
        if i + chunk_size >= len(full_text):
            break

    return chunks, chunk_pages


@app.get("/health")
def health():
    return {"status": "ok", "document_loaded": _session["index"] is not None}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Accept a PDF, process it, and build the FAISS index."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        from core.embedder import build_index

        full_text, page_texts = _extract_pdf_with_pages(tmp_path)
        chunks, chunk_pages = _chunk_with_pages(page_texts, chunk_size=500, overlap=50)
        index, chunks = build_index(chunks)

        _session["index"] = index
        _session["chunks"] = chunks
        _session["chunk_pages"] = chunk_pages
        _session["full_text"] = full_text
        _session["history"] = []

        return {
            "status": "success",
            "chunks": len(chunks),
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


class ChatRequest(BaseModel):
    query: str


@app.post("/chat")
async def chat(req: ChatRequest):
    """Answer a question using the indexed document."""
    if _session["index"] is None:
        raise HTTPException(status_code=400, detail="No document loaded. Upload a PDF first.")

    try:
        from core.retriever import retrieve_chunks
        from core.generator import rewrite_query, generate_answer

        rewritten = rewrite_query(req.query)

        # Retrieve top-k chunk indices alongside text
        retrieved_chunks, retrieved_indices = _retrieve_with_indices(
            rewritten, _session["index"], _session["chunks"], top_k=5
        )

        answer = generate_answer(req.query, retrieved_chunks, _session["history"])

        # Map each retrieved chunk to its page number
        chunk_pages = _session.get("chunk_pages") or []
        pages = [
            chunk_pages[i] if i < len(chunk_pages) else 1
            for i in retrieved_indices
        ]

        _session["history"].append({"role": "user", "content": req.query})
        _session["history"].append({"role": "assistant", "content": answer})

        return {
            "answer": answer,
            "chunks": retrieved_chunks,
            "pages": pages,
            "query": req.query,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _retrieve_with_indices(query: str, index, chunks: list, top_k: int = 5):
    """Like retrieve_chunks but also returns the original indices."""
    import numpy as np
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = model.encode([query], convert_to_numpy=True).astype("float32")
    distances, indices = index.search(query_embedding, min(top_k, len(chunks)))
    idx_list = indices[0].tolist()
    return [chunks[i] for i in idx_list], idx_list


@app.post("/reset")
def reset():
    _session["index"] = None
    _session["chunks"] = None
    _session["chunk_pages"] = None
    _session["full_text"] = ""
    _session["history"] = []
    return {"status": "reset"}
