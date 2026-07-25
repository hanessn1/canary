# Subsystem & Component Architecture Design

This document details the modular component structure of Canary across the React Web Frontend, Java Spring Boot Backend Gateway, and Python FastAPI AI Engine.

## Component Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Frontend Tier (React 18 + Vite)"]
        UI_ChatView["ChatView (Dialogue & Citation Inspector)"]
        UI_LibraryView["LibraryView (Document Management Table & ConfirmDialog)"]
        UI_SettingsView["SettingsView (System Health & RAG Parameters)"]
        UI_Sidebar["Sidebar (Navigation & Active Chats List)"]
        UI_ChatContext["ChatContext (Conversations State & LocalStorage Persistence)"]
        UI_DocsContext["DocumentsContext (Document List State & Upload Queue)"]
        UI_ApiClient["chatApi / documentApi (Fetch & SSE Stream Readers)"]
        
        UI_ChatView --> UI_ChatContext
        UI_LibraryView --> UI_DocsContext
        UI_Sidebar --> UI_ChatContext
        UI_SettingsView --> UI_ChatContext
        UI_ChatContext --> UI_ApiClient
        UI_DocsContext --> UI_ApiClient
    end

    subgraph Backend ["Backend Gateway Tier (Java 25 Spring Boot 3.5)"]
        BE_DocController["DocumentController (/api/v1/documents)"]
        BE_ChatController["ChatController (/api/v1/chat & /api/v1/chat/stream)"]
        BE_HealthController["HealthController (/api/v1/health)"]
        BE_DocService["DocumentService (Upload Validation & Async Indexing Trigger)"]
        BE_StorageService["LocalStorageService (Raw File FS Storage: storage/uploads)"]
        BE_DocRepo["InMemoryDocumentRepository (Metadata Persistence: storage/documents.json)"]
        BE_HttpAiClient["HttpAiClient (RestClient Outbound Proxy to AI Engine)"]

        BE_DocController --> BE_DocService
        BE_DocService --> BE_StorageService
        BE_DocService --> BE_DocRepo
        BE_DocService --> BE_HttpAiClient
        BE_ChatController --> BE_HttpAiClient
        BE_HealthController --> BE_DocService
    end

    subgraph AIEngine ["AI & Retrieval Tier (Python 3.11 FastAPI Engine)"]
        AI_Main["main.py (FastAPI App & Route Handlers)"]
        AI_Parser["parser.py (PyPDF, python-docx, TXT, MD Parsers)"]
        AI_Chunker["chunker.py (Recursive Character Text Splitter)"]
        AI_Embedder["embedder.py (Httpx Client to Ollama /api/embeddings)"]
        AI_VectorStore["vector_store.py (FAISS IndexFlatIP & Chunk JSON Persistence)"]
        AI_Retriever["retriever.py (Query Embedding, FAISS Search & BM25Okapi Re-Ranker)"]
        AI_ChatService["chat.py (Intent Classifier, System Prompt Builder & Agent Loop)"]
        AI_Tools["tools.py (Function Call Handlers & JSON Schemas)"]

        AI_Main --> AI_Parser
        AI_Main --> AI_Chunker
        AI_Main --> AI_Embedder
        AI_Main --> AI_VectorStore
        AI_Main --> AI_Retriever
        AI_Main --> AI_ChatService
        AI_Retriever --> AI_Embedder
        AI_Retriever --> AI_VectorStore
        AI_ChatService --> AI_Retriever
        AI_ChatService --> AI_Tools
    end

    subgraph Engine ["Local Inference Engine (Ollama)"]
        Ollama_LLM["Ollama /api/chat (qwen2.5:3b)"]
        Ollama_Embed["Ollama /api/embeddings (nomic-embed-text)"]
    end

    subgraph Storage ["Local Storage Disk"]
        FS_Uploads["storage/uploads/ (Raw PDF, DOCX, TXT, MD Files)"]
        FS_Vectors["storage/vectors/ (FAISS .index & Chunks .json)"]
        FS_Meta["storage/documents.json (Document Metadata Database)"]
    end

    UI_ApiClient -->|HTTP REST / SSE Stream| BE_DocController
    UI_ApiClient -->|HTTP REST / SSE Stream| BE_ChatController
    BE_HttpAiClient -->|HTTP REST| AI_Main
    AI_Embedder -->|HTTP POST| Ollama_Embed
    AI_ChatService -->|HTTP Stream POST| Ollama_LLM

    BE_StorageService --> FS_Uploads
    BE_DocRepo --> FS_Meta
    AI_Parser --> FS_Uploads
    AI_VectorStore --> FS_Vectors
```

## Detailed Subsystem Responsibilities

### 1. Presentation Tier (`frontend/src`)
- **`ChatView.jsx`**: Dialogue pane rendering user messages, streaming assistant tokens, loading indicators, active document scope selector, inline chat title editing, and interactive **Citation Inspector** drawer.
- **`LibraryView.jsx`**: Table displaying document library metadata, upload dropzone, refresh trigger, and `ConfirmDialog` modal.
- **`SettingsView.jsx`**: Displays Canary API and Ollama service health, dropdown model selectors (`CustomSelect`), and RAG control sliders (Temperature, Top-K, Similarity Threshold).
- **`Sidebar.jsx`**: Main navigation links, active chat list with visual tab highlighting for selected chat, and system health status lines.
- **`ChatContext.jsx`**: React Context state manager storing conversation histories, active conversation ID, RAG parameters, model selections, and `localStorage` persistence.
- **`DocumentsContext.jsx`**: Manages uploaded document list, upload progress state, background status polling (`UPLOADED` -> `PROCESSING` -> `READY`), and document deletion.

### 2. Backend Gateway Tier (`backend/src/main/java/com/canary/backend`)
- **`DocumentController`**: Handles multipart document uploads, listing, single document retrieval, and deletion requests.
- **`ChatController`**: Exposes synchronous (`POST /api/v1/chat`) and streaming (`POST /api/v1/chat/stream`) chat endpoints using Spring `SseEmitter`.
- **`DocumentService`**: Validates file extensions and size limits, delegates raw file writes to `LocalStorageService`, and triggers `@Async` vector indexing via `HttpAiClient`.
- **`LocalStorageService`**: Manages local filesystem storage (`storage/uploads`).
- **`InMemoryDocumentRepository`**: Thread-safe in-memory store for document metadata, atomically saved to disk (`storage/documents.json`).
- **`HttpAiClient`**: Outbound HTTP client implementing `AiClient`, communicating with the FastAPI AI Engine.

### 3. AI Engine Tier (`ai/`)
- **`main.py`**: FastAPI server exposing endpoints `/api/v1/index`, `/api/v1/retrieve`, `/api/v1/models`, `/api/v1/chat`, `/api/v1/index/{id}`, and `/health`.
- **`parser.py`**: Reads raw files from `storage/uploads/` (PDF via `PyPDF`, DOCX via `python-docx`, TXT/MD via UTF-8 text readers) and returns page numbers and text.
- **`chunker.py`**: Splitting text pages recursively into chunks (chunk size: 500 characters, overlap: 50 characters).
- **`embedder.py`**: Asynchronous HTTP client requesting dense embeddings from Ollama (`nomic-embed-text`).
- **`vector_store.py`**: FAISS index manager creating `IndexFlatIP` indices (`storage/vectors/{id}.index`) and metadata files (`storage/vectors/{id}.json`).
- **`retriever.py`**: Executes dense vector search (FAISS cosine similarity with threshold filtering) combined with sparse keyword re-ranking (`BM25Okapi`) in a single pass.
- **`chat.py`**: Manages intent classification (`classify_intent`), context prompt construction, streaming generator (`_stream_agent_loop`), and tool execution (`execute_tool`).
- **`tools.py`**: Tool functions (`get_system_time`, `list_documents`, `search_documents`) and JSON schemas (`TOOL_SCHEMAS`).
