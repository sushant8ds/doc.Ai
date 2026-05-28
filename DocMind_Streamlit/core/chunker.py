"""Split text into overlapping chunks"""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping chunks.
    
    Args:
        text: The text to chunk
        chunk_size: Size of each chunk in characters
        overlap: Number of overlapping characters between chunks
        
    Returns:
        list[str]: List of text chunks
    """
    if not text or len(text) == 0:
        return []
    
    chunks = []
    step = chunk_size - overlap
    
    for i in range(0, len(text), step):
        chunk = text[i : i + chunk_size]
        
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)
        
        if i + chunk_size >= len(text):  # Last chunk
            break
    
    return chunks
