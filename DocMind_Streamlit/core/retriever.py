"""Retrieve relevant chunks using semantic search"""

import numpy as np


def retrieve_chunks(query: str, index, chunks: list[str], top_k: int = 5) -> list[str]:
    """
    Retrieve the most relevant chunks for a query.
    
    Args:
        query: The search query
        index: FAISS index
        chunks: List of all chunks
        top_k: Number of chunks to retrieve
        
    Returns:
        list[str]: Top-k relevant chunks
    """
    from sentence_transformers import SentenceTransformer
    
    # Load model and encode query
    model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = model.encode([query], convert_to_numpy=True)
    query_embedding = np.array(query_embedding).astype("float32")
    
    # Search index
    distances, indices = index.search(query_embedding, min(top_k, len(chunks)))
    
    # Return chunks
    return [chunks[i] for i in indices[0]]

