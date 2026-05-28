"""Generate answers using Ollama LLM"""


def generate_answer(query: str, chunks: list[str], history: list = None) -> str:
    """
    Generate an answer using Ollama.
    
    Args:
        query: User's question
        chunks: Retrieved relevant chunks
        history: Conversation history (optional)
        
    Returns:
        str: Generated answer
    """
    import ollama
    
    # Build context from chunks
    context = "\n\n".join([f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)])
    
    # Build prompt
    prompt = f"""Use the following context to answer the question.

CONTEXT:
{context}

QUESTION: {query}

ANSWER:"""
    
    try:
        response = ollama.generate(
            model="llama3.2",
            prompt=prompt,
            stream=False,
            options={"num_ctx": 2048, "top_k": 40, "top_p": 0.9}
        )
        
        answer = response.get("response", "").strip()
        return answer if answer else "I couldn't generate an answer."
        
    except Exception as e:
        return f"Error generating answer: {str(e)}"


def rewrite_query(query: str) -> str:
    """
    Optionally rewrite the query for better retrieval (or just return as-is).
    
    Args:
        query: Original query
        
    Returns:
        str: Rewritten or original query
    """
    # For now, just return the query as-is
    # You could implement query expansion here
    return query
