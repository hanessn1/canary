# Canary - AI Document Intelligence Platform

## Executive Summary & Vision

**Canary** is a production-grade, local-first AI document intelligence platform. It provides document ingestion, asynchronous parsing, vector indexing, semantic search, hybrid retrieval, and Retrieval-Augmented Generation (RAG) using local LLMs.

Unlike simple AI prototypes, Canary emphasizes software engineering quality: clean architecture, modular service separation, robust error handling, state persistence, and zero reliance on external cloud AI APIs. All data processing and model inference remain local on the user's system.

## Key Platform Capabilities

### 1. Document Ingestion & Parsing
- Multi-format ingestion: **PDF**, **DOCX**, **TXT**, and **Markdown (`.md`)**.
- Asynchronous status processing (`UPLOADED` -> `PROCESSING` -> `READY` / `FAILED`).
- Document metadata tracking (checksum, original file name, size, page count, upload timestamp).

### 2. Hybrid Retrieval Pipeline (FAISS + BM25)
- **Dense Vector Search**: FAISS `IndexFlatIP` with L2-normalized cosine embeddings (`nomic-embed-text`).
- **Sparse Keyword Search**: `BM25Okapi` re-ranking over candidate chunks.
- **Combined Scoring**: Hybrid scoring formula ($0.7 \times \text{semantic\_score} + 0.3 \times \text{bm25\_score}$) to maximize retrieval precision.

### 3. Retrieval-Augmented Generation (RAG)
- Token-by-token **Server-Sent Events (SSE)** streaming.
- Grounded prompt assembly with strict citation enforcement (`[Page <N>]`).
- Interactive **Citation Inspector** panel in web UI.
- Contextual intent classification to route general conversational queries vs. document-grounded queries.

### 4. Interactive Tool Calling & Agent Loop
- Autonomous tool execution loop supporting system time query, document library listing, and hybrid document search.

### 5. Local State & Parameter Persistence
- Persistent configuration across tab navigation and browser refreshes (`localStorage` integration).
- Configurable RAG controls: Temperature, Top-K chunk retrieval, and Cosine Similarity Thresholds.

## Technical Stack

| Tier | Component | Technology |
| :--- | :--- | :--- |
| **Frontend** | Single Page Application | React 18, Vite, Custom Vanilla CSS, Lucide Icons |
| **Backend API** | Orchestration & Storage | Java 25, Spring Boot 3.5, RestClient, SseEmitter |
| **AI Service** | Embedding & Retrieval | Python 3.11, FastAPI, FAISS, rank_bm25, PyPDF, python-docx |
| **LLM Engine** | Local Inference | Ollama (`qwen2.5:3b`, `nomic-embed-text`) |
| **Deployment** | Multi-Container Stack | Docker, Docker Compose, Shared Storage Volumes |

## Architectural Principles

1. **Local-First Privacy**: User documents, vector indices, and conversation histories never leave the local environment.
2. **Decoupled Service Layers**: Business logic in Spring Boot is independent of Python AI execution algorithms.
3. **Fail-Safe Fallbacks**: Graceful error handling and fallback model lists ensure application stability even when Ollama is offline.
4. **Configurable Execution**: Environment-driven pathing and customizable hyper-parameters allow running locally or inside Docker without hardcoded paths.