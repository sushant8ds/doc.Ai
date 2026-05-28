#!/bin/bash
# DocMind AI — Backend Server Startup
# Run this from the DocMind_Streamlit directory

echo "🧠 Starting DocMind AI Backend..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

python3 -m uvicorn server:app --reload --port 8000 --host 0.0.0.0
