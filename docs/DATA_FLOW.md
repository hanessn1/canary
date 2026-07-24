# Ingestion & Vector Indexing Data Flow Sequence

This document describes the end-to-end data flow when a user uploads a new document into Canary.

## Step-by-Step Ingestion & Indexing Flow Diagram

![alt text](diagrams/architecture_flow.svg)

## Detailed Ingestion Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Web UI
    participant UI_Docs as DocumentsContext
    participant Backend as DocumentController (Spring Boot)
    participant LocalStorage as LocalStorageService
    participant DocRepo as InMemoryDocumentRepository
    participant AiClient as HttpAiClient (@Async)
    participant FastAPI as FastAPI (/api/v1/index)
    participant Parser as Parser (PyPDF / python-docx / Text)
    participant Chunker as Recursive Chunker
    participant Embedder as Embedder (Ollama)
    participant VectorStore as VectorStore (FAISS)

    User->>UI_Docs: Upload File (PDF / DOCX / TXT / MD)
    UI_Docs->>Backend: POST /api/v1/documents (multipart/form-data)
    Backend->>Backend: Validate file extension & size limit (10MB)
    Backend->>LocalStorage: Save raw file bytes to storage/uploads/{id}.{ext}
    Backend->>DocRepo: Save document metadata (status = UPLOADED)
    Backend-->>UI_Docs: Return Document Response (status = UPLOADED)

    Backend->>AiClient: indexDocument(documentId, filename) [@Async Execution]
    AiClient->>DocRepo: Update document status to PROCESSING
    AiClient->>FastAPI: POST /api/v1/index (document_id, filename)

    FastAPI->>Parser: parse_document(storage/uploads/{filename})
    Parser-->>FastAPI: returns pages [{page: N, text: "..."}]
    
    FastAPI->>Chunker: chunk_pages(pages, chunk_size=500, chunk_overlap=50)
    Chunker-->>FastAPI: returns text chunks [{text: "...", page: N}]

    FastAPI->>Embedder: get_embeddings(texts)
    Embedder->>Embedder: Batch HTTP POST to Ollama /api/embeddings
    Embedder-->>FastAPI: returns vector embeddings list[list[float]]

    FastAPI->>VectorStore: save_index(document_id, embeddings, chunks)
    VectorStore->>VectorStore: L2-normalize vectors with faiss.normalize_L2()
    VectorStore->>VectorStore: Build FAISS IndexFlatIP index
    VectorStore->>VectorStore: Write binary index to storage/vectors/{id}.index
    VectorStore->>VectorStore: Write chunk metadata JSON to storage/vectors/{id}.json
    VectorStore-->>FastAPI: Index saved successfully

    FastAPI-->>AiClient: HTTP 200 {"status": "success", "chunks_count": N}
    AiClient->>DocRepo: Update document status to READY
    
    loop Status Polling Interval (2s)
        UI_Docs->>Backend: GET /api/v1/documents
        Backend-->>UI_Docs: Returns document list (status = READY)
        UI_Docs-->>User: UI updates document badge status to READY
    end
```

## Detailed Data Ingestion Pipeline Steps

### 1. Web Upload & Storage Initialization
1. User drops or selects a file in `LibraryView.jsx`.
2. `DocumentsContext` issues a multipart HTTP POST request to `POST /api/v1/documents`.
3. `DocumentController` verifies that the file format is supported (`pdf`, `docx`, `txt`, `md`) and that the file size is under the `10 MB` threshold.
4. `LocalStorageService` writes raw binary contents to `storage/uploads/<documentId>.<ext>`.
5. Metadata is recorded in `InMemoryDocumentRepository` with `status = UPLOADED`.

### 2. Asynchronous Indexing Dispatch
1. `DocumentService` triggers `@Async` method `HttpAiClient.indexDocument(documentId, filename)`.
2. Document status changes to `PROCESSING`.
3. `HttpAiClient` posts JSON payload `{"document_id": "...", "filename": "..."}` to the AI engine at `POST /api/v1/index`.

### 3. Parsing, Chunking & Embedding Generation
1. `parse_document()` opens the raw file from `storage/uploads/` using PyPDF for PDFs, python-docx for DOCX, and UTF-8 text readers for Markdown and TXT files.
2. `chunk_pages()` splits page text recursively into focused chunks (chunk size: 500 characters, overlap: 50 characters).
3. `Embedder.get_embeddings()` posts batch text arrays to local Ollama engine (`nomic-embed-text`).

### 4. FAISS Index & Metadata Storage
1. Vectors are normalized using `faiss.normalize_L2()`.
2. FAISS `IndexFlatIP` inner-product vector index is generated and written to `storage/vectors/{documentId}.index`.
3. Chunk metadata text map is saved to `storage/vectors/{documentId}.json`.
4. AI service returns success response. Backend updates document status to `READY`.
