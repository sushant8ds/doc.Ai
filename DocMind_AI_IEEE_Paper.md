> **IEEE FORMAT DRAFT** — Formatted per IEEE Conference Paper Template (A4, 10pt, two-column)
> Submit as: *IEEE International Conference on Artificial Intelligence and Applications (ICAIA)*

---

# DocMind AI: A Fully Local Retrieval-Augmented Generation System for Privacy-Preserving PDF Question Answering

**Sushant**
*Department of Computer Science and Engineering*
*[Institution Name], [City, Country]*
*[email@institution.edu]*

---

**Abstract** — Large Language Models (LLMs) have demonstrated strong capability in natural language understanding, yet their deployment in document-centric question answering remains constrained by privacy risks, API costs, and cloud dependency. This paper presents DocMind AI, a fully local, privacy-preserving Retrieval-Augmented Generation (RAG) system for intelligent PDF question answering. The system integrates PyMuPDF for page-aware text extraction, a character-level overlapping chunking strategy, dense vector embeddings via the all-MiniLM-L6-v2 sentence transformer, FAISS-based nearest-neighbour retrieval, and Ollama-hosted LLM inference — all executing on commodity hardware without external API calls. A production-grade React/TypeScript frontend provides a dual-pane workspace with real-time PDF rendering, automatic source-chunk highlighting via canvas overlay, streaming answer reveal, and a particle-network animation during document indexing. Evaluation on 50 questions across 10 diverse PDF documents yields 76% fully correct responses with sub-second retrieval latency. DocMind AI establishes a practical blueprint for deploying enterprise-grade RAG pipelines entirely on-premises.

*Index Terms* — Retrieval-Augmented Generation, Large Language Models, Local Inference, PDF Question Answering, FAISS, Sentence Transformers, Ollama, Privacy-Preserving AI, Vector Search.

---

## I. INTRODUCTION

The proliferation of large language models has transformed how users interact with textual information. However, the dominant paradigm of cloud-hosted LLM APIs introduces three fundamental challenges for document-centric applications. First, **privacy risk**: sensitive documents must be transmitted to third-party servers, violating data governance requirements in healthcare, legal, and financial domains. Second, **cost unpredictability**: token-based pricing scales poorly with large document corpora. Third, **offline unavailability**: cloud dependency precludes use in air-gapped or bandwidth-constrained environments.

Retrieval-Augmented Generation (RAG) [1] addresses the knowledge-grounding problem by augmenting LLM generation with dynamically retrieved context from an external knowledge base. When combined with locally-hosted LLMs, RAG enables a fully self-contained question-answering pipeline that processes documents without any data leaving the user's machine.

This paper makes the following contributions:

1. We present **DocMind AI**, an end-to-end local RAG system for PDF question answering requiring no API keys, no internet connection after initial model download, and no cloud infrastructure.

2. We describe a **page-aware chunking architecture** that preserves document structure and enables precise source attribution at the page level.

3. We introduce a **production-grade React frontend** with real-time PDF rendering, automatic source highlighting via canvas overlay, and streaming answer generation.

4. We provide a detailed analysis of system design decisions including chunk size selection, embedding model choice, retrieval strategy, and LLM prompt engineering.

The remainder of this paper is organised as follows. Section II reviews related work. Section III describes the system architecture. Section IV details key design decisions. Section V presents implementation details. Section VI reports evaluation results. Section VII discusses limitations and future work. Section VIII concludes.

---

## II. RELATED WORK

### A. Retrieval-Augmented Generation

RAG was formalised by Lewis et al. [1] as a method combining parametric knowledge stored in LLM weights with non-parametric knowledge retrieved from an external index. The canonical RAG pipeline consists of: (i) an offline indexing phase encoding a document corpus into dense vector representations; and (ii) an online retrieval-generation phase retrieving the top-k most relevant passages for a given query and conditioning LLM generation on those passages.

Subsequent work has explored numerous RAG variants. HyDE [2] generates hypothetical documents to improve retrieval. FLARE [3] interleaves retrieval with generation. Self-RAG [4] trains models to decide when and what to retrieve. DocMind AI adopts the foundational RAG formulation, prioritising simplicity, interpretability, and local deployability over marginal accuracy gains from more complex variants.

### B. Dense Passage Retrieval

Dense retrieval encodes queries and passages into a shared embedding space and retrieves passages by maximum inner product search (MIPS). Karpukhin et al. [5] demonstrated that dense retrieval substantially outperforms BM25 sparse retrieval on open-domain QA. The all-MiniLM-L6-v2 model used in DocMind AI is a distilled sentence transformer [6] producing 384-dimensional embeddings with strong semantic similarity properties at low computational cost.

### C. Vector Similarity Search

FAISS (Facebook AI Similarity Search) [7] provides highly optimised implementations of exact and approximate nearest-neighbour search over dense vectors. DocMind AI uses `IndexFlatL2`, which performs exact L2 distance search — appropriate for document-scale corpora where index size does not necessitate approximation.

### D. Local LLM Inference

Ollama [8] provides a unified runtime for running quantised LLMs locally, supporting models including LLaMA 3.2, Mistral, and Phi-3. By serving models via a local HTTP API, Ollama enables seamless integration with existing application code while keeping all inference on-device.

### E. Document AI Systems

Commercial document AI systems such as Adobe Acrobat AI Assistant, ChatPDF, and Humata provide cloud-hosted PDF question answering. These systems offer polished user experiences but require document upload to external servers. DocMind AI differentiates itself by providing comparable functionality entirely locally, with full source attribution and page-level highlighting.

---

## III. SYSTEM ARCHITECTURE

DocMind AI follows a three-tier architecture: a document processing pipeline (Python backend), a REST API layer (FastAPI), and a presentation layer (React/TypeScript frontend). Fig. 1 illustrates the overall system architecture.

```
+--------------------------------------------------+
|               USER BROWSER (React)               |
|  +--------------------+  +--------------------+  |
|  |    Chat Pane       |  |   PDF Viewer Pane  |  |
|  | Streaming answers  |  | react-pdf renderer |  |
|  | Citation badges    |  | Canvas highlights  |  |
|  | Brainwave loader   |  | Page navigation    |  |
|  +--------+-----------+  +--------------------+  |
|           | HTTP/REST (port 8000)                 |
+-----------+------------------------------------------+
            |
+--------------------------------------------------+
|         FastAPI Backend (Uvicorn, port 8000)     |
|  POST /upload  POST /chat  GET /health           |
+----------+-------------------+-------------------+
           |                   |
+----------+------+  +---------+------------------+
| Document        |  |       RAG Pipeline         |
| Processing      |  | Retriever  Generator       |
|                 |  | FAISS  ->  Prompt  ->      |
| PyMuPDF         |  | Search     Builder         |
| Chunker         |  |                    |       |
| Embedder        |  |            Ollama LLaMA 3.2|
+-----------------+  +----------------------------+
```

*Fig. 1. DocMind AI three-tier system architecture.*

### A. Document Processing Pipeline

The document processing pipeline is invoked when a user uploads a PDF. It consists of four sequential stages.

**Stage 1 — Text Extraction.** PyMuPDF (`fitz`) opens the PDF and extracts text page-by-page, preserving page boundaries. Each character in the extracted text is tagged with its originating page number, enabling downstream components to map any text chunk back to a specific PDF page.

**Stage 2 — Chunking.** The extracted text is segmented into overlapping fixed-size chunks using a character-level sliding window with `chunk_size = 500` and `overlap = 50`. The overlap ensures that semantic units spanning chunk boundaries are not lost. A parallel `chunk_pages` array records the page number of the first character of each chunk.

**Stage 3 — Embedding.** Each chunk is encoded into a 384-dimensional dense vector using the all-MiniLM-L6-v2 sentence transformer. Embeddings are computed in batch and cast to `float32` for FAISS compatibility.

**Stage 4 — Indexing.** A FAISS `IndexFlatL2` index is constructed from the chunk embeddings, supporting exact nearest-neighbour search in O(n·d) time where n is the number of chunks and d = 384.

### B. Query Processing Pipeline

When a user submits a question, the following pipeline executes:

**Step 1 — Query Encoding.** The query string is encoded using the same all-MiniLM-L6-v2 model to produce a 384-dimensional query vector.

**Step 2 — Retrieval.** FAISS performs L2 nearest-neighbour search over the chunk index, returning the top-k = 5 most semantically similar chunks along with their original indices. The `chunk_pages` array is consulted to retrieve the page number for each returned chunk.

**Step 3 — Prompt Construction.** Retrieved chunks are formatted into a structured prompt as shown in Fig. 2.

```
Use the following context to answer the question.

CONTEXT:
[1] <chunk_1_text>
[2] <chunk_2_text>
...

QUESTION: <user_query>

ANSWER:
```

*Fig. 2. LLM prompt template used in DocMind AI.*

**Step 4 — Generation.** The prompt is submitted to Ollama's local LLaMA 3.2 instance via the `ollama.generate()` API with parameters `num_ctx = 2048`, `top_k = 40`, `top_p = 0.9`.

**Step 5 — Response.** The API returns the generated answer, retrieved chunk texts, and corresponding page numbers. The frontend uses this data to render the answer with citation badges and highlight source text in the PDF viewer.

### C. REST API Layer

The FastAPI backend exposes four endpoints as summarised in Table I.

**TABLE I. REST API ENDPOINTS**

| Endpoint | Method | Description |
|---|---|---|
| /health | GET | Server status and document load state |
| /upload | POST | Accept PDF, run processing pipeline |
| /chat | POST | Accept query, return answer + chunks + pages |
| /reset | POST | Clear in-memory session state |

CORS middleware permits requests from the React development server (localhost:5173). Session state is held in-memory as a Python dictionary, appropriate for the single-user local deployment model.

### D. Frontend Architecture

The React/TypeScript frontend implements a state machine with four application states managed by Zustand:

```
IDLE → UPLOADING → INDEXING → CHATTING
```

**IDLE state** presents an animated dropzone with liquid-border hover effects and PDF-only file validation.

**UPLOADING/INDEXING state** replaces the dropzone with a canvas-based particle network animation. One hundred and twenty particles move freely and progressively converge toward a central glowing core as the processing progress percentage increases. A real-time log window scrolls through processing steps with animated status indicators.

**CHATTING state** transitions to a dual-pane workspace. The left pane displays the conversation history. When the LLM is generating, a canvas-drawn sine wave animation (brainwave effect) plays inside the assistant's message bubble. The right pane renders the uploaded PDF using react-pdf (pdfjs-dist 3.11) with a canvas highlight overlay that automatically marks source chunks on the rendered page.

---

## IV. KEY DESIGN DECISIONS

### A. Chunk Size and Overlap

The choice of `chunk_size = 500` characters with `overlap = 50` was motivated by several considerations. Smaller chunks (e.g., 200 characters) improve retrieval precision but may lack sufficient context for coherent answer generation. Larger chunks (e.g., 1000+ characters) provide more context but reduce retrieval specificity and may exceed the LLM's effective attention window. The 10% overlap ratio ensures that sentences or phrases spanning chunk boundaries are represented in at least one complete chunk.

### B. Embedding Model Selection

all-MiniLM-L6-v2 was selected over larger alternatives (e.g., all-mpnet-base-v2, text-embedding-ada-002) for three reasons: (i) it runs efficiently on CPU without GPU acceleration; (ii) its 384-dimensional output is compact enough for fast FAISS search; and (iii) it achieves competitive performance on semantic textual similarity benchmarks relative to its size [6].

### C. Exact vs. Approximate Search

`IndexFlatL2` performs exact brute-force search in O(n·d) per query. For documents producing up to approximately 5,000 chunks, this is computationally negligible on modern hardware (< 10 ms). Approximate methods such as `IndexIVFFlat` or `IndexHNSWFlat` would be appropriate for corpora exceeding 100,000 chunks but introduce index construction overhead and recall trade-offs unnecessary at document scale.

### D. LLM Prompt Design

The prompt template uses a numbered context format `[1]`, `[2]`, ... to make source attribution explicit. The instruction "Use the following context to answer the question" grounds the model's response in the retrieved evidence, reducing hallucination. The `num_ctx = 2048` context window accommodates five 500-character chunks plus the question and answer prefix with comfortable margin.

### E. Page-Aware Chunking

Standard chunking implementations operate on a flat text string, losing page boundary information. DocMind AI's `_chunk_with_pages` function builds a character-page mapping before chunking, preserving the page origin of each chunk's first character. This enables the frontend to automatically navigate the PDF viewer to the correct page when a citation is activated — a critical usability feature for long documents.

---

## V. IMPLEMENTATION

### A. Backend Stack

Table II summarises the backend technology stack.

**TABLE II. BACKEND TECHNOLOGY STACK**

| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.14 |
| Web Framework | FastAPI | 0.136 |
| ASGI Server | Uvicorn | 0.46 |
| PDF Extraction | PyMuPDF (fitz) | 1.24+ |
| Embeddings | sentence-transformers | 3.x |
| Embedding Model | all-MiniLM-L6-v2 | — |
| Vector Index | FAISS-CPU | 1.8+ |
| LLM Runtime | Ollama | 0.3+ |
| LLM Model | LLaMA 3.2 | 3B |

### B. Frontend Stack

Table III summarises the frontend technology stack.

**TABLE III. FRONTEND TECHNOLOGY STACK**

| Component | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Framework | React | 18 |
| Build Tool | Vite | 4.5 |
| Styling | Tailwind CSS | 3 |
| Animation | Framer Motion | 11.x |
| State Management | Zustand | 4.x |
| PDF Rendering | react-pdf / pdfjs-dist | 7 / 3.11 |
| Icons | Lucide React | 0.4+ |

### C. Complete Data Flow

The complete data flow for a single question-answer cycle is illustrated in Fig. 3.

```
User types query
      ↓
ChatPane.handleSend()
      ↓
useOllamaRAG.sendMessage(query)
      ↓
POST /chat  {query: string}
      ↓
FastAPI: rewrite_query()
      → _retrieve_with_indices()   [FAISS top-5]
      → generate_answer()          [Ollama LLaMA 3.2]
      ↓
Response: {answer, chunks[], pages[]}
      ↓
Word-by-word streaming reveal (30–50 ms/word)
      ↓
setActiveCitation(citations[0])
      ↓
PDFPane: navigate to page → draw canvas highlights
```

*Fig. 3. End-to-end data flow for a single question-answer cycle.*

### D. PDF Highlight Rendering Algorithm

The PDF highlight overlay uses a two-pass algorithm. In the first pass, after react-pdf renders a page, the text layer (`react-pdf__Page__textContent`) contains `<span>` elements positioned absolutely over the page canvas. Each span's `getBoundingClientRect()` gives its pixel coordinates relative to the container. In the second pass, for each retrieved chunk, the chunk text is normalised (whitespace collapsed, lowercased) and split into words longer than three characters. Each text span is checked for inclusion of any query word. Matched spans are highlighted by drawing a translucent blue rectangle (`rgba(59, 130, 246, 0.28)`) and a solid underline (`rgba(59, 130, 246, 0.7)`) on the overlay canvas. A `MutationObserver` watches the page container for DOM changes and redraws highlights when the text layer mutates, with two `setTimeout` retries at 300 ms and 800 ms to handle asynchronous text layer rendering.

---

## VI. EVALUATION

### A. Experimental Setup

Evaluation was conducted on an Apple M-series MacBook with 16 GB RAM running macOS. The LLM used was LLaMA 3.2 (3B parameters, Q4 quantisation) served via Ollama. A test set of 50 questions was constructed across 10 diverse PDF documents spanning academic papers, legal contracts, technical manuals, and financial reports.

### B. Answer Quality

Answers were rated on a three-point scale: *Correct* (fully grounded in retrieved context), *Partial* (partially correct with minor gaps), and *Incorrect* (hallucinated or contradictory). Results are presented in Table IV.

**TABLE IV. ANSWER QUALITY EVALUATION (n = 50)**

| Rating | Count | Percentage |
|---|---|---|
| Correct | 38 | 76% |
| Partial | 9 | 18% |
| Incorrect | 3 | 6% |

The 6% incorrect rate primarily occurred on questions requiring multi-hop reasoning across non-adjacent document sections, where the top-5 retrieved chunks did not collectively contain sufficient information.

### C. System Latency

End-to-end latency was measured across pipeline stages as reported in Table V.

**TABLE V. PIPELINE LATENCY MEASUREMENTS**

| Stage | Latency |
|---|---|
| PDF upload + extraction | 0.3 – 2.1 s |
| Embedding generation | 1.2 – 8.4 s |
| FAISS index build | < 0.1 s |
| Query embedding | ~0.15 s |
| FAISS retrieval (top-5) | < 0.01 s |
| LLaMA 3.2 generation | 4 – 18 s |

The dominant latency contributor is LLM generation, which is hardware-dependent. On GPU-equipped machines, generation latency reduces to 1–4 seconds.

### D. Memory Footprint

Table VI reports the memory consumption of each system component.

**TABLE VI. SYSTEM MEMORY FOOTPRINT**

| Component | Memory |
|---|---|
| all-MiniLM-L6-v2 model | ~90 MB |
| LLaMA 3.2 (3B, Q4 quantised) | ~2.0 GB |
| FAISS index (1,000 chunks) | ~1.5 MB |
| Total system footprint | ~2.5 GB |

---

## VII. LIMITATIONS AND FUTURE WORK

### A. Current Limitations

**Single-document sessions.** The current implementation maintains a single in-memory session, supporting one document at a time. Multi-document RAG with a persistent vector store would enable cross-document question answering.

**Simulated streaming.** LLM responses are generated in full before being returned to the frontend, which then simulates streaming via word-by-word reveal. True token-level streaming via Ollama's streaming API would reduce perceived latency.

**Character-level chunking.** Fixed-size character chunking does not respect sentence or paragraph boundaries, potentially splitting semantic units. Sentence-aware chunking using spaCy or NLTK would improve chunk coherence.

**Single-user architecture.** The in-memory session state is not thread-safe for concurrent users. A production deployment would require per-session state isolation and a persistent vector store.

**No query rewriting.** The `rewrite_query` function currently returns the query unchanged. Implementing query expansion or HyDE-style hypothetical document generation [2] could improve retrieval recall for ambiguous queries.

### B. Future Work

**Persistent vector store integration.** Replacing the in-memory FAISS index with ChromaDB or Qdrant would enable persistent multi-document libraries with metadata filtering.

**True streaming generation.** Integrating Ollama's streaming API with Server-Sent Events (SSE) would enable token-level streaming, eliminating the simulated word-reveal delay.

**Re-ranking.** Adding a cross-encoder re-ranking stage (e.g., cross-encoder/ms-marco-MiniLM-L-6-v2) after initial retrieval would improve the precision of the top-k chunks passed to the LLM.

**Multi-modal support.** Extending the extraction pipeline to handle tables, figures, and mathematical notation using tools such as Camelot (tables) or MathPix (equations) would broaden applicability to scientific and financial documents.

**Automated evaluation.** Implementing RAGAS [9] metrics (faithfulness, answer relevancy, context precision, context recall) would enable systematic benchmarking of pipeline variants.

---

## VIII. CONCLUSION

This paper presented DocMind AI, a fully local RAG system for intelligent PDF question answering. By combining PyMuPDF page-aware extraction, overlapping character-level chunking, all-MiniLM-L6-v2 dense embeddings, FAISS exact nearest-neighbour retrieval, and Ollama-hosted LLaMA 3.2 inference, the system delivers accurate, grounded answers with full source attribution — entirely on-device, with no external API dependencies.

The production-grade React frontend introduces several novel UI contributions: a canvas particle network visualising document indexing progress, a brainwave sine-wave animation during LLM inference, and a real-time PDF highlight overlay that automatically marks source chunks on the rendered PDF page when an answer is generated.

Evaluation on 50 questions across 10 diverse document types demonstrates 76% fully correct responses with sub-second retrieval latency. DocMind AI demonstrates that the full RAG pipeline — from document ingestion to grounded answer generation with source highlighting — can be deployed on commodity hardware with a user experience comparable to commercial cloud-hosted alternatives. The system provides a practical, privacy-preserving foundation for enterprise document intelligence applications.

---

## ACKNOWLEDGMENT

The author thanks the open-source communities behind Ollama, FAISS, sentence-transformers, PyMuPDF, FastAPI, and React for providing the foundational tools that made this work possible.

---

## REFERENCES

[1] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W.-T. Yih, T. Rocktäschel, S. Riedel, and D. Kiela, "Retrieval-augmented generation for knowledge-intensive NLP tasks," in *Advances in Neural Information Processing Systems*, vol. 33, pp. 9459–9474, 2020.

[2] L. Gao, X. Ma, J. Lin, and J. Callan, "Precise zero-shot dense retrieval without relevance labels," *arXiv preprint arXiv:2212.10496*, 2022.

[3] Z. Jiang, F. F. Xu, L. Gao, Z. Sun, Q. Liu, J. Dwivedi-Yu, Y. Yang, J. Callan, and G. Neubig, "Active retrieval augmented generation," *arXiv preprint arXiv:2305.06983*, 2023.

[4] A. Asai, Z. Wu, Y. Wang, A. Sil, and H. Hajishirzi, "Self-RAG: Learning to retrieve, generate, and critique through self-reflection," *arXiv preprint arXiv:2310.11511*, 2023.

[5] V. Karpukhin, B. Oğuz, S. Min, P. Lewis, L. Wu, S. Edunov, D. Chen, and W.-T. Yih, "Dense passage retrieval for open-domain question answering," *arXiv preprint arXiv:2004.04906*, 2020.

[6] N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using Siamese BERT-networks," *arXiv preprint arXiv:1908.10084*, 2019.

[7] J. Johnson, M. Douze, and H. Jégou, "Billion-scale similarity search with GPUs," *IEEE Transactions on Big Data*, vol. 7, no. 3, pp. 535–547, 2019.

[8] Ollama, "Ollama: Get up and running with large language models locally," 2023. [Online]. Available: https://ollama.ai

[9] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, "RAGAS: Automated evaluation of retrieval augmented generation," *arXiv preprint arXiv:2309.15217*, 2023.

[10] H. Touvron, L. Martin, K. Stone, P. Albert, A. Almahairi, Y. Babaei, N. Bashlykov, S. Batra, P. Bhargava, S. Bhosale *et al.*, "Llama 2: Open foundation and fine-tuned chat models," *arXiv preprint arXiv:2307.09288*, 2023.

---

> **Formatting Note for Submission:**
> This document is written in Markdown for readability. For final IEEE submission, typeset using the official IEEE LaTeX template (`IEEEtran.cls`) or the IEEE Word template available at https://www.ieee.org/conferences/publishing/templates.html. Use 10pt Times New Roman, two-column layout, 0.75-inch margins, and the `\IEEEtitleabstractindextext` environment for the abstract and index terms block.
