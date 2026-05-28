"""Generate embeddings and build FAISS index"""

import numpy as np


def build_index(chunks: list[str]):
    """
    Build a FAISS index from text chunks.
    
    Args:
        chunks: List of text chunks
        
    Returns:
        tuple: (faiss_index, chunks)
    """
    import faiss
    
    # Import model only when needed
    from sentence_transformers import SentenceTransformer
    
    # Load model
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Encode chunks
    embeddings = model.encode(chunks, convert_to_numpy=True)
    embeddings = np.array(embeddings).astype("float32")
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    return index, chunks


def get_embeddings(texts: list[str]) -> np.ndarray:
    """
    Get embeddings for a list of texts.
    
    Args:
        texts: List of text strings
        
    Returns:
        np.ndarray: Embeddings array
    """
    from sentence_transformers import SentenceTransformer
    
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(texts, convert_to_numpy=True)
    
    return np.array(embeddings).astype("float32")
