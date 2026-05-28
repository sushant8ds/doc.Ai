# 🧠 DocMind AI – Intelligent Document Q&A System

A fully local, 100% free intelligent document question-answering system powered by Retrieval Augmented Generation (RAG), Ollama, and FAISS.

## Features

✅ **100% Local** — No API keys, no internet required  
✅ **Privacy-First** — All data stays on your machine  
✅ **Multi-Format Support** — PDF, DOCX, and TXT documents  
✅ **RAG Architecture** — Combines semantic search with LLM synthesis  
✅ **Multi-Turn Conversations** — Full context awareness across questions  
✅ **Hallucination Detection** — Verifies answers against source material  
✅ **Document Summaries** — Auto-generated summaries and key topics  
✅ **Source Attribution** — See which chunks informed each answer  

## Tech Stack

- **UI**: Streamlit
- **PDF Processing**: PyMuPDF (fitz)
- **Document Parsing**: python-docx
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Vector Search**: FAISS (CPU)
- **LLM**: Ollama (llama3.2)
- **Language**: Python 3.8+

## Installation

### Prerequisites

1. **Python 3.8 or higher**
   ```bash
   python --version
   ```

2. **Ollama installed and configured**
   - Download from: https://ollama.ai
   - Install and start the service: `ollama serve`
   - Pull the model: `ollama pull llama3.2`

### Setup

1. **Clone or download the project**
   ```bash
   cd DocMind_Streamlit
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ensure Ollama is running**
   ```bash
   # In a separate terminal
   ollama serve
   ```

## Usage

### Start the Application

```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

### Workflow

1. **Upload Document**
   - Click "📄 Upload a document" in the sidebar
   - Select a PDF, DOCX, or TXT file

2. **Process Document**
   - Click "⚙️ Process Document"
   - The system will:
     - Extract text
     - Create overlapping chunks
     - Generate embeddings
     - Build FAISS index
     - Generate document summary

3. **Ask Questions**
   - Type your question in the chat input
   - Press Enter or click the message icon
   - The system will:
     - Rewrite query for optimal retrieval
     - Search FAISS index for relevant chunks
     - Generate answer using Ollama
     - Verify answer against source material
     - Show source chunks and hallucination check

4. **Manage Conversation**
   - "Clear Conversation" — Reset chat history
   - "New Document" — Load a different document

## Project Structure

```
DocMind_Streamlit/
├── requirements.txt          # Python dependencies
├── app.py                    # Main Streamlit application
└── core/                     # Core modules
    ├── __init__.py          # Package initialization
    ├── extractor.py         # Document text extraction
    ├── chunker.py           # Text chunking logic
    ├── embedder.py          # Embedding generation & FAISS indexing
    ├── retriever.py         # Semantic chunk retrieval
    ├── generator.py         # Answer generation & quality checks
    └── memory.py            # Conversation history management
```

## Configuration

### Adjustable Parameters

Edit `app.py` or core modules to adjust:

- **Chunk Size**: Change `chunk_size=500` in `chunk_text()` calls
- **Chunk Overlap**: Change `overlap=50` in `chunk_text()` calls
- **Top-K Retrieval**: Change `top_k=5` in `retrieve_chunks()` calls
- **LLM Model**: Change `model="llama3.2"` to any available Ollama model

### Available Ollama Models

```bash
ollama pull llama3.2      # Default - fast, capable
ollama pull llama2        # Older, lighter
ollama pull mistral       # Fast inference
ollama pull neural-chat   # Optimized for chat
```

## API Reference

### Core Modules

#### extractor.py
```python
from core.extractor import extract_text

text = extract_text("document.pdf")  # Returns str
```

#### chunker.py
```python
from core.chunker import chunk_text

chunks = chunk_text(text, chunk_size=500, overlap=50)  # Returns list[str]
```

#### embedder.py
```python
from core.embedder import build_index

index, chunks = build_index(chunks)  # Returns (faiss.Index, list[str])
```

#### retriever.py
```python
from core.retriever import retrieve_chunks

relevant = retrieve_chunks(query, index, chunks, top_k=5)  # Returns list[str]
```

#### generator.py
```python
from core.generator import (
    rewrite_query,
    generate_answer,
    check_hallucination,
    generate_document_summary
)

# Query optimization
optimized = rewrite_query("What is this about?")  # Returns str

# Answer generation
answer = generate_answer(query, chunks, history)  # Returns str

# Hallucination checking
verdict = check_hallucination(answer, chunks)  # Returns str

# Document analysis
summary = generate_document_summary(text)  # Returns dict
```

#### memory.py
```python
from core.memory import ConversationMemory

memory = ConversationMemory()
memory.add_exchange("Question?", "Answer.")
history = memory.get_history()  # list[dict]
memory.clear()
```

## Troubleshooting

### "Connection refused" or Ollama errors

**Solution**: Ensure Ollama is running
```bash
ollama serve
```

### Slow performance

**Solution**: Reduce chunk size or use a faster model
```bash
ollama pull mistral  # Faster than llama3.2
```

### Out of memory errors

**Solution**: Use a lighter model or reduce context window
```bash
ollama pull neural-chat  # Smaller model
```

### FAISS errors

**Solution**: Ensure `numpy` and `faiss-cpu` are compatible
```bash
pip install --upgrade numpy faiss-cpu
```

## Performance Tips

1. **First Run**: Embedding model download takes ~1-2 minutes
2. **Large Documents**: Processing time scales with document size
3. **Queries**: Rewriting queries takes ~2-3 seconds
4. **Answers**: Generation takes 5-15 seconds depending on model

## Limitations

- Requires Ollama to be installed and running
- First answer generation may be slower (model loading)
- Very large documents (>100MB) may cause memory issues
- Hallucination detection isn't perfect but improves verification

## Privacy & Security

✅ **All processing is local** — No data leaves your machine  
✅ **No telemetry** — No tracking or usage analytics  
✅ **No internet required** — Works completely offline (after setup)  
✅ **Open source components** — All dependencies are transparent  

## Contributing

Feel free to fork, modify, and improve!

Suggestions for enhancements:
- GPT-4 integration (with API keys)
- Streaming responses
- Document caching
- Multi-language support
- Custom prompt templates
- Web UI enhancements

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify Ollama is running correctly
3. Check Python version compatibility
4. Review error messages carefully

## Acknowledgments

Built with:
- [Streamlit](https://streamlit.io/)
- [Ollama](https://ollama.ai/)
- [FAISS](https://github.com/facebookresearch/faiss)
- [Sentence Transformers](https://www.sbert.net/)
- [PyMuPDF](https://github.com/pymupdf/PyMuPDF)

---

**DocMind AI** — Making document understanding intelligent, local, and free. 🧠
