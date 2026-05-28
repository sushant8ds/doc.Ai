"""
DocMind AI - Complete Streamlit Application
"""

import streamlit as st
import sys
import os

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

st.set_page_config(
    page_title="DocMind AI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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

# ========== SIDEBAR ==========
with st.sidebar:
    st.markdown("# 🧠 DocMind AI")
    st.markdown("**Intelligent Document Understanding**")
    st.divider()

    uploaded_file = st.file_uploader(
        "📄 Upload a document",
        type=["pdf", "txt", "docx"],
        help="Supported formats: PDF, TXT, DOCX"
    )

    if st.button("⚙️ Process Document", use_container_width=True, type="primary"):
        if uploaded_file is None:
            st.error("Please upload a document first.")
        else:
            try:
                # Step 1: Extract text
                st.info("📖 Extracting text...")
                from core.extractor import extract_text
                from core.chunker import chunk_text
                from core.embedder import build_index

                temp_path = f"temp_{uploaded_file.name}"
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())

                full_text = extract_text(temp_path)
                st.session_state.full_text = full_text

                # Step 2: Chunk
                st.info("✂️ Chunking text...")
                chunks = chunk_text(full_text, chunk_size=500, overlap=50)

                # Step 3: Build index
                st.info("🧠 Building index (this takes ~1 min)...")
                index, chunks = build_index(chunks)

                st.session_state.index = index
                st.session_state.chunks = chunks
                st.session_state.processing_done = True

                if os.path.exists(temp_path):
                    os.remove(temp_path)

                st.success(f"✅ Done! {len(chunks)} chunks indexed. You can now ask questions!")
                st.rerun()

            except ValueError as e:
                st.error(f"❌ Unsupported file type: {str(e)}")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

    if st.session_state.processing_done:
        st.divider()
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.memory_history = []
                st.rerun()
        with col2:
            if st.button("↻ New Doc", use_container_width=True):
                st.session_state.index = None
                st.session_state.chunks = None
                st.session_state.memory_history = []
                st.session_state.doc_summary = None
                st.session_state.processing_done = False
                st.session_state.full_text = ""
                st.rerun()


# ========== MAIN AREA ==========
if not st.session_state.processing_done:
    st.markdown("# 🧠 Welcome to DocMind AI")
    st.markdown("### Intelligent Document Question-Answering System")
    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
**What it does:**
- 📄 Read any PDF, DOCX, or TXT file
- 🔍 Find the most relevant parts for your question
- 🧠 Generate a precise synthesized answer
- ✅ Check if the answer is supported by the document
- 💬 Remember your previous questions in the same session
        """)
    with col2:
        st.markdown("""
**How to use:**
1. Upload a document in the sidebar
2. Click **Process Document**
3. Wait for indexing (~1 minute first time)
4. Type your question in the chat box
5. Get your answer!
        """)

    st.info("👈 Upload a document in the sidebar to get started.")

else:
    st.markdown("### 💬 Chat with Your Document")

    for message in st.session_state.memory_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    user_input = st.chat_input("Ask a question about your document...")

    if user_input:
        with st.chat_message("user"):
            st.markdown(user_input)

        try:
            from sentence_transformers import SentenceTransformer
            import numpy as np
            from core.generator import rewrite_query, generate_answer, check_hallucination

            with st.spinner("🔍 Finding relevant sections..."):
                # Rewrite query
                rewritten = rewrite_query(user_input)

                # Retrieve chunks directly here (avoids import issue)
                model = SentenceTransformer("all-MiniLM-L6-v2")
                query_embedding = model.encode([rewritten], convert_to_numpy=True).astype('float32')
                distances, indices = st.session_state.index.search(query_embedding, 5)
                retrieved = [st.session_state.chunks[i] for i in indices[0] if i < len(st.session_state.chunks)]

            with st.spinner("💡 Generating answer..."):
                answer = generate_answer(user_input, retrieved, st.session_state.memory_history)

            with st.spinner("✅ Checking answer quality..."):
                hallucination_check = check_hallucination(answer, retrieved)

            st.session_state.memory_history.append({"role": "user", "content": user_input})
            st.session_state.memory_history.append({"role": "assistant", "content": answer})

            with st.chat_message("assistant"):
                st.markdown(answer)

                with st.expander("🔍 Source Chunks", expanded=False):
                    for i, chunk in enumerate(retrieved, 1):
                        st.markdown(f"**Chunk {i}:**")
                        st.info(chunk[:300] + "..." if len(chunk) > 300 else chunk)

                verdict_lines = hallucination_check.split('\n')
                verdict = verdict_lines[0].strip().upper() if verdict_lines else "UNKNOWN"
                explanation = '\n'.join(verdict_lines[1:]).strip() if len(verdict_lines) > 1 else ""

                if "SUPPORTED" in verdict and "PARTIALLY" not in verdict:
                    st.success(f"✅ SUPPORTED — {explanation}")
                elif "PARTIALLY" in verdict:
                    st.warning(f"⚠️ PARTIALLY SUPPORTED — {explanation}")
                else:
                    st.error(f"❌ NOT SUPPORTED — {explanation}")

        except Exception as e:
            st.error(f"❌ Error: {str(e)}")
            st.info("💡 Make sure Ollama is running: `ollama serve`")

st.divider()
st.caption("🧠 DocMind AI • Local • No APIs • 100% Private")