# High-Level Architecture Design (HLD)

Canary is designed as a modular, local-first AI document intelligence platform. The system decouples presentation, business orchestration, vector search, and local LLM inference across three distinct runtime tiers: the **React Web UI**, the **Java Spring Boot Backend Gateway**, and the **Python FastAPI AI Engine**, backed by **FAISS Vector Storage** and the **Ollama LLM Engine**.

## High-Level System Architecture Diagram

```mermaid
graph LR
    subgraph ClientLayer ["1. Presentation Layer"]
        ReactUI["React 18 Web UI<br/>(Library, Chat, Settings, Inspector)"]
    end

    subgraph BackendLayer ["2. Orchestration Layer"]
        SpringBoot["Java 25 Spring Boot Gateway<br/>(REST Controllers, SseEmitter, Metadata DB)"]
        LocalStorage["Local File Storage<br/>(storage/uploads & documents.json)"]
    end

    subgraph AILayer ["3. AI & Retrieval Engine"]
        FastAPI["Python 3.11 FastAPI AI Service<br/>(Parser, Chunker, Hybrid Retriever)"]
        FAISS["FAISS IndexFlatIP Store<br/>(storage/vectors/*.index & *.json)"]
        BM25["BM25Okapi Keyword Re-Ranker"]
    end

    subgraph LLMLayer ["4. Local Inference Engine"]
        Ollama["Ollama Local LLM Engine<br/>(qwen2.5:3b & nomic-embed-text)"]
    end

    ReactUI <-->|HTTP REST & SSE Stream| SpringBoot
    SpringBoot <-->|Async REST HTTP| FastAPI
    SpringBoot -->|Raw File Reads/Writes| LocalStorage
    FastAPI -->|Extract Raw Files| LocalStorage
    FastAPI <-->|Dense Search| FAISS
    FastAPI <-->|Keyword Search| BM25
    FastAPI <-->|Embeddings & Chat Inference| Ollama
```

## System Topology & Subsystems

### 1. Presentation Layer (React Web Frontend)
- **Framework**: React 18 SPA built with Vite.
- **Role**: Provides a modern, responsive web application for document upload management, active conversation threads, live token streaming dialogue, citation inspection, and RAG control hyper-parameters.
- **Communication**: Interacts with Spring Boot via REST APIs and Server-Sent Events (SSE) stream connections.

### 2. Orchestration Layer (Java Spring Boot Backend)
- **Framework**: Java 25 & Spring Boot 3.5.
- **Role**: Serves as the central API gateway and domain manager. Manages HTTP request validation, file storage on disk (`storage/uploads`), document metadata persistence (`storage/documents.json`), and async HTTP proxying to the AI Engine.

### 3. AI & Retrieval Layer (Python FastAPI Engine)
- **Framework**: Python 3.11 with FastAPI.
- **Role**: Ingests files (PDF, DOCX, TXT, MD), splits text recursively into chunks, computes dense vector embeddings via Ollama (`nomic-embed-text`), manages FAISS `IndexFlatIP` indices on disk (`storage/vectors`), executes single-pass hybrid retrieval (FAISS + BM25Okapi), and streams LLM output with page citations.

### 4. Local Inference Engine (Ollama)
- **Role**: Provides local model inference for text embeddings (`nomic-embed-text`) and language generation (`qwen2.5:3b`). Operates 100% locally with zero cloud AI API dependencies.

## Key Design Principles

- **Strict Responsibility Separation**: Backend business logic is isolated from vector mathematics and AI algorithms.
- **Local-First Privacy**: User documents, vector indices, and conversation histories never leave the user's hardware.
- **Resilient Fallbacks**: Automatic fallback handling ensures application UI stability even when Ollama is offline or restarting.
