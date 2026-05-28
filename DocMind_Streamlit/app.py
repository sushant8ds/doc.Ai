"""
DocMind AI - Streamlit Application

A fully local, 100% free Intelligent Document Q&A system using RAG
"""

import streamlit as st
import sys
import os

st.set_page_config(page_title="DocMind AI", page_icon="🧠", layout="wide")

# Add parent directory to path  
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize session state
if "index" not in st.session_state:
    st.session_state.index = None
if "chunks" not in st.session_state:
    st.session_state.chunks = None
if "memory_history" not in st.session_state:
    st.session_state.memory_history = []
if "doc_summary" not in st.session_state:
    st.session_state.doc_summary = None
if "processing_done" not in st.session_state:
    st.session_state.processing_done = False
if "full_text" not in st.session_state:
    st.session_state.full_text = ""

st.title("🧠 DocMind AI")
st.markdown("**Intelligent Document Q&A System**")

# Sidebar
with st.sidebar:
    st.markdown("### 📄 Upload Document")
    
    uploaded_file = st.file_uploader("Choose a file", type=["pdf", "txt", "docx"])
    
    if st.button("⚙️ Process Document", type="primary", use_container_width=True):
        if uploaded_file is None:
            st.error("Please upload a document first")
        else:
            try:
                # Create progress containers
                progress_container = st.container()
                
                with progress_container:
                    st.info("📖 Extracting text from document...")
                
                # Lazy import and extract text
                from core.extractor import extract_text
                temp_path = f"temp_{uploaded_file.name}"
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                full_text = extract_text(temp_path)
                
                with progress_container:
                    st.info("✂️ Chunking text into segments...")
                
                # Lazy import and chunk
                from core.chunker import chunk_text
                chunks = chunk_text(full_text, chunk_size=500, overlap=50)
                
                with progress_container:
                    st.info("🧠 Building semantic index (embeddings)...")
                
                # Lazy import and build index
                from core.embedder import build_index
                index, chunks = build_index(chunks)
                
                # Store index and chunks
                st.session_state.index = index
                st.session_state.chunks = chunks
                st.session_state.full_text = full_text
                
                with progress_container:
                    st.info("📝 Generating document summary...")
                
                # Try to summarize
                try:
                    from core.generator import generate_document_summary
                    summary = generate_document_summary(full_text)
                    st.session_state.doc_summary = summary
                except Exception as e:
                    st.session_state.doc_summary = {"summary": "Summary unavailable"}
                
                # Clean up
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                st.session_state.processing_done = True
                
                with progress_container:
                    st.success(f"✅ Done! Processed {len(chunks)} chunks")
                
                st.rerun()
                
            except Exception as e:
                st.error(f"❌ Error: {str(e)[:200]}")
                st.info("💡 Make sure Ollama is running: `ollama serve`")
                if os.path.exists(temp_path):
                    os.remove(temp_path)

# Show summary if available
if st.session_state.processing_done and st.session_state.doc_summary:
    with st.sidebar.expander("📋 Document Summary"):
        doc_summary = st.session_state.doc_summary
        if isinstance(doc_summary, dict):
            if "summary" in doc_summary:
                st.caption(doc_summary["summary"][:300])
            if "topics" in doc_summary:
                topic_list = doc_summary["topics"]
                if isinstance(topic_list, list):
                    st.caption("**Topics**: " + ", ".join(topic_list[:3]))
                    
    with st.sidebar:
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.memory_history = []
                st.rerun()
        with col2:
            if st.button("↻ New Document", use_container_width=True):
                st.session_state.processing_done = False
                st.session_state.index = None
                st.session_state.chunks = None
                st.session_state.memory_history = []
                st.session_state.doc_summary = None
                st.rerun()

# Main area
if not st.session_state.processing_done:
    st.info("""
    ### Welcome to DocMind AI
    
    **How to use:**
    1. Upload a PDF, DOCX, or TXT file in the sidebar
    2. Click "Process Document"
    3. Ask questions about your document!
    
    Everything runs locally. No data sent anywhere.
    
    **Requirements:**
    - Ollama must be installed and running
    - Run: `ollama serve` in a terminal
    """)
else:
    # Display chat history
    for msg in st.session_state.memory_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
    
    # Chat input
    if user_query := st.chat_input("Ask a question..."):
        # Show user message immediately
        with st.chat_message("user"):
            st.markdown(user_query)
        
        try:
            # Lazy imports and processing
            from core.retriever import retrieve_chunks
            from core.generator import rewrite_query, generate_answer
            
            with st.spinner("🤔 Finding relevant information..."):
                rewritten = rewrite_query(user_query)
                retrieved = retrieve_chunks(rewritten, st.session_state.index, st.session_state.chunks, top_k=5)
            
            with st.spinner("💡 Generating answer..."):
                answer = generate_answer(user_query, retrieved, st.session_state.memory_history)
            
            # Store in history
            st.session_state.memory_history.append({"role": "user", "content": user_query})
            st.session_state.memory_history.append({"role": "assistant", "content": answer})
            
            # Display assistant response
            with st.chat_message("assistant"):
                st.markdown(answer)
                
                with st.expander("🔍 Source Chunks"):
                    for i, chunk in enumerate(retrieved, 1):
                        disp_text = chunk[:200] + "..." if len(chunk) > 200 else chunk
                        st.caption(f"**Chunk {i}:** {disp_text}")
            
        except Exception as e:
            st.error(f"❌ Error: {str(e)[:200]}")
            st.info("💡 Make sure Ollama is running: `ollama serve`")

st.divider()
st.caption("🧠 DocMind AI • Local • No APIs • 100% Private")
