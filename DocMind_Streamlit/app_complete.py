"""DocMind AI - DocMind AI RAG Document Q&A System"""
import streamlit as st
import os
import sys

st.set_page_config(page_title="DocMind AI", page_icon="🧠", layout="wide")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Session state
for key, default in [
    ("index", None),
    ("chunks", None),
    ("memory_history", []),
    ("processing_done", False),
    ("full_text", ""),
]:
    if key not in st.session_state:
        st.session_state[key] = default

# SIDEBAR
with st.sidebar:
    st.markdown("# 🧠 DocMind AI")
    st.markdown("**Intelligent Document Q&A**")
    st.divider()
    
    doc = st.file_uploader("📄 Upload Document", type=["pdf", "txt", "docx"])
    
    if st.button("⚙️ Process Document", use_container_width=True, type="primary"):
        if not doc:
            st.error("Upload a document first")
        else:
            try:
                with st.spinner("Processing..."):
                    # Import here - lazy loading
                    from core.extractor import extract_text
                    from core.chunker import chunk_text
                    from core.embedder import build_index
                    
                    # Fixed temp path - no spaces
                    temp_path = "temp_doc.pdf"
                    try:
                        with open(temp_path, "wb") as f:
                            f.write(doc.getbuffer())
                        
                        # Extract
                        text = extract_text(temp_path)
                        st.session_state.full_text = text
                        
                        # Chunk
                        chunks = chunk_text(text, chunk_size=500, overlap=50)
                        
                        # Index (no summary!)
                        idx, chunks = build_index(chunks)
                        
                        # Store
                        st.session_state.index = idx
                        st.session_state.chunks = chunks
                        st.session_state.processing_done = True
                        
                        st.success(f"✅ {len(chunks)} chunks indexed")
                    finally:
                        if os.path.exists(temp_path):
                            try:
                                os.remove(temp_path)
                            except:
                                pass
            except Exception as e:
                st.error(f"Error: {str(e)[:100]}")
    
    if st.session_state.processing_done:
        st.divider()
        c1, c2 = st.columns(2)
        with c1:
            if st.button("🗑️ Clear", use_container_width=True):
                st.session_state.memory_history = []
        with c2:
            if st.button("↻ Reset", use_container_width=True):
                st.session_state.index = None
                st.session_state.chunks = None
                st.session_state.memory_history = []
                st.session_state.processing_done = False
                st.session_state.full_text = ""

# MAIN
if not st.session_state.processing_done:
    st.markdown("""
    # 🧠 Welcome to DocMind AI
    
    Upload a PDF, DOCX, or TXT file in the sidebar and click "Process Document".
    
    Then ask questions about your document!
    
    Everything runs **100% locally** with Ollama.
    """)
else:
    st.markdown("### 💬 Chat with Your Document")
    
    # Display history
    for msg in st.session_state.memory_history:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])
    
    # Input
    if query := st.chat_input("Ask a question..."):
        st.chat_message("user").write(query)
        
        try:
            with st.spinner("🤔 Thinking..."):
                from core.retriever import retrieve_chunks
                from core.generator import rewrite_query, generate_answer
                
                # Rewrite
                q2 = rewrite_query(query)
                
                # Retrieve
                chunks = retrieve_chunks(q2, st.session_state.index, st.session_state.chunks, top_k=5)
                
                # Generate
                ans = generate_answer(query, chunks, st.session_state.memory_history)
                
                # Store
                st.session_state.memory_history.append({"role": "user", "content": query})
                st.session_state.memory_history.append({"role": "assistant", "content": ans})
            
            # Display
            st.chat_message("assistant").write(ans)
            
            with st.expander("📚 Source Chunks"):
                for i, chunk in enumerate(chunks, 1):
                    st.caption(f"**{i}.** {chunk[:200]}...")
        
        except Exception as e:
            st.error(f"Error: {str(e)[:150]}")
            st.info("Make sure Ollama is running: `ollama serve`")

st.divider()
st.caption("🧠 DocMind AI • 100% Local • No APIs")
