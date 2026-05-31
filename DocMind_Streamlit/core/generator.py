"""Generate answers, key points, and follow-up suggestions using Ollama LLM"""

import json
import re


def generate_answer(query: str, chunks: list[str], history: list = None) -> str:
    """Generate an answer using Ollama."""
    import ollama

    context = "\n\n".join([f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)])

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


def generate_insights(query: str, answer: str, chunks: list[str]) -> dict:
    """
    Given the question, answer, and source chunks, generate:
      - key_points: list of 3-5 concise bullet points summarising the answer
      - suggested_questions: list of 3 follow-up questions the user could ask next

    Returns a dict: {"key_points": [...], "suggested_questions": [...]}
    Falls back to empty lists on any error.
    """
    import ollama

    context = "\n\n".join([f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)])

    prompt = f"""You are an intelligent document assistant. Based on the question, answer, and source context below, do two things:

1. Extract 3 to 5 KEY POINTS from the answer — short, clear bullet points that capture the most important facts.
2. Suggest 3 FOLLOW-UP QUESTIONS that are relevant, insightful, and can be answered from the same document.

QUESTION: {query}

ANSWER: {answer}

CONTEXT:
{context}

Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
{{
  "key_points": [
    "First key point here",
    "Second key point here",
    "Third key point here"
  ],
  "suggested_questions": [
    "First follow-up question?",
    "Second follow-up question?",
    "Third follow-up question?"
  ]
}}"""

    try:
        response = ollama.generate(
            model="llama3.2",
            prompt=prompt,
            stream=False,
            options={"num_ctx": 2048, "top_k": 20, "top_p": 0.85, "temperature": 0.3}
        )
        raw = response.get("response", "").strip()

        # Extract JSON even if the model wraps it in markdown code fences
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return {
                "key_points": data.get("key_points", [])[:5],
                "suggested_questions": data.get("suggested_questions", [])[:3],
            }
    except Exception:
        pass

    return {"key_points": [], "suggested_questions": []}


def rewrite_query(query: str) -> str:
    """Return the query as-is (query expansion can be added here)."""
    return query


def check_hallucination(answer: str, chunks: list[str]) -> dict:
    """
    Verify whether the answer is grounded in the retrieved source chunks.

    Returns a dict:
    {
        "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED",
        "confidence": 0-100,
        "reason": "short explanation"
    }
    Falls back to {"verdict": "UNKNOWN", "confidence": 0, "reason": "..."} on error.
    """
    import ollama

    context = "\n\n".join([f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)])

    prompt = f"""You are a fact-checking assistant. Your job is to verify whether an AI-generated answer is supported by the provided source context.

SOURCE CONTEXT (retrieved from the document):
{context}

AI-GENERATED ANSWER:
{answer}

Instructions:
- Read the answer carefully.
- Check each claim in the answer against the source context.
- Decide on one of three verdicts:
  * SUPPORTED — every major claim in the answer is directly backed by the context.
  * PARTIALLY_SUPPORTED — some claims are backed by context, but others are not found or are extrapolated.
  * NOT_SUPPORTED — the answer contains claims that contradict or are absent from the context.
- Give a confidence score from 0 to 100 (how confident you are in your verdict).
- Write a short 1-sentence reason.

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "verdict": "SUPPORTED",
  "confidence": 85,
  "reason": "All key claims about X and Y are directly present in chunks [1] and [3]."
}}"""

    try:
        response = ollama.generate(
            model="llama3.2",
            prompt=prompt,
            stream=False,
            options={"num_ctx": 2048, "top_k": 10, "top_p": 0.8, "temperature": 0.1}
        )
        raw = response.get("response", "").strip()

        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            verdict = data.get("verdict", "UNKNOWN").upper()
            # Normalise any variant spellings the model might produce
            if verdict in ("PARTIAL", "PARTIAL_SUPPORT", "PARTIALLY SUPPORTED"):
                verdict = "PARTIALLY_SUPPORTED"
            if verdict not in ("SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED"):
                verdict = "UNKNOWN"
            return {
                "verdict": verdict,
                "confidence": max(0, min(100, int(data.get("confidence", 0)))),
                "reason": str(data.get("reason", ""))[:300],
            }
    except Exception as e:
        pass

    return {"verdict": "UNKNOWN", "confidence": 0, "reason": "Could not verify answer."}
