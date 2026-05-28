"""Minimal test app"""
import streamlit as st

st.set_page_config(page_title="DocMind AI Test", layout="wide")
st.title("🧠 DocMind AI - Test")
st.write("If you see this, the app is working!")

# Test session state
if "counter" not in st.session_state:
    st.session_state.counter = 0

if st.button("Click me"):
    st.session_state.counter += 1
    st.write(f"Count: {st.session_state.counter}")
