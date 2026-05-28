"""
DocMind AI - Streamlit Application (Test Version)

A fully local, 100% free Intelligent Document Q&A system using RAG
"""

import streamlit as st
import sys
import os

st.set_page_config(page_title="DocMind AI", page_icon="🧠", layout="wide")

st.title("🧠 DocMind AI")
st.markdown("**Intelligent Document Q&A System**")

try:
    # Add parent directory to path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Import core modules
    from core.extractor import extract_text
    from core.chunker import chunk_text
    from core.embedder import build_index
    from core.retriever import retrieve_chunks
    from core.generator import rewrite_query, generate_answer, check_hallucination, generate_document_summary
    from core.memory import ConversationMemory
    
    st.success("✅ All modules loaded successfully!")
    
except Exception as e:
    st.error(f"❌ Error loading modules: {str(e)}")
    import traceback
    st.error(traceback.format_exc())
    st.stop()

# Initialize session state
if "memory" not in st.session_state:
    st.session_state.memory = ConversationMemory()
if "processing_done" not in st.session_state:
    st.session_state.processing_done = False

st.info("📝 Test version loaded. You can now upload documents and ask questions!")
