# Project Roadmap & Deliverables

## Implemented Core Milestones

### Phase 1: Core System & Infrastructure `[Completed]`
- [x] Spring Boot 3.5 Java backend API layer setup
- [x] React SPA frontend with dark/light dynamic theme system
- [x] FastAPI Python AI service setup
- [x] Multi-container Docker & Docker Compose setup (`hanessn/canary-*`)

### Phase 2: Ingestion & Document Processing `[Completed]`
- [x] PDF, DOCX, Markdown, and TXT document parsing
- [x] Recursive text chunking with configurable overlap
- [x] Local text embeddings via `nomic-embed-text`
- [x] FAISS `IndexFlatIP` vector index persistence

### Phase 3: Hybrid Retrieval & Streaming RAG `[Completed]`
- [x] BM25Okapi sparse keyword re-ranking
- [x] Hybrid scoring algorithm ($0.7 \times \text{semantic} + 0.3 \times \text{keyword}$)
- [x] SSE streaming chat endpoint with real-time citations
- [x] Interactive Citation Inspector panel in UI

### Phase 4: Agentic Capabilities & State Persistence `[Completed]`
- [x] Ollama local function calling loop (time, document discovery, search)
- [x] Intent classification for document context routing vs conversational mode
- [x] Persistent web settings and model selections via `localStorage`
- [x] Configurable RAG parameters (temperature, top-K, similarity threshold)

## Future Extensibility Roadmap

### Phase 5: Advanced Search & Vector Storage
- [ ] PostgreSQL `pgvector` storage adapter
- [ ] Cross-encoder re-ranking (BGE-Reranker)
- [ ] Automatic document tagging & summarization pre-computation

### Phase 6: Multimodal Processing & Agent Workflows
- [ ] OCR support for scanned documents (Tesseract / EasyOCR)
- [ ] Multi-agent research workflows
- [ ] Model Context Protocol (MCP) server integration