"""Minimal working DocMind AI app"""
import streamlit as st
import sys
import os

st.set_page_config(page_title="Doc Mind AI", layout="wide")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

st.sidebar.markdown("# 📄 Upload")
doc = st.sidebar.file_uploader("Choose file", type=["pdf", "txt", "docx"])

if st.sidebar.button("⚙️ Process"):
    if not doc:
        st.error("Upload first")
    else:
        try:
            with st.spinner("Processing..."):
                from core.extractor import extract_text
                from core.chunker import chunk_text
                from core.embedder import build_index
                
                temp = f"temp_{doc.name}"
                with open(temp, "wb") as f:
                    f.write(doc.getbuffer())
                
                text = extract_text(temp)
                chunks = chunk_text(text)
                idx, chunks = build_index(chunks)
                
                st.session_state.idx = idx
                st.session_state.chunks = chunks
                st.session_state.done = True
                
                if os.path.exists(temp):
                    os.remove(temp)
                
                st.success(f"✅ {len(chunks)} chunks")
        except Exception as e:
            st.error(str(e)[:150])

if "done" not in st.session_state:
    st.session_state.done = False

if not st.session_state.done:
    st.info("💡 Upload a document and click Process")
else:
    st.markdown("### Ask Questions")
    
    if q := st.chat_input("Question..."):
        st.chat_message("user").write(q)
        
        try:
            from core.retriever import retrieve_chunks
            from core.generator import rewrite_query, generate_answer
            
            q2 = rewrite_query(q)
            chunks = retrieve_chunks(q2, st.session_state.idx, st.session_state.chunks, 5)
            ans = generate_answer(q, chunks, [])
            
            st.chat_message("assistant").write(ans)
        except Exception as e:
            st.error(str(e)[:150])
