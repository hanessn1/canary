# Canary — AI Document Intelligence Platform

### Project Goal

Canary is a fully local AI-powered document intelligence platform capable of ingesting documents, indexing them, understanding their contents, and answering user questions using Retrieval-Augmented Generation (RAG).

The primary objective is to build a production-quality software engineering project rather than a simple AI demo.

The application should emphasize:

- Clean architecture
- Scalability
- Modular design
- Backend engineering best practices
- Local-first execution
- Modern AI techniques

The project should require **no cloud AI** APIs for its core functionality. All inference should run locally using Ollama or llama.cpp with GGUF models.

The system should be capable of processing large collections of documents while remaining responsive through asynchronous indexing, caching, and efficient retrieval.

## Primary Objectives

The system should support:

- Uploading documents
- Parsing multiple document formats
- Indexing documents
- Semantic search
- Hybrid search
- Question answering
- Summarization
- Tool calling
- Conversation history
- Citation generation
- Streaming responses
- Multi-document reasoning

Everything should operate through a modern web interface.

## Architecture Goals

Always prioritize maintainability over quick implementation. The project should follow clean architecture principles.

Suggested layers:

```markdown
Frontend

↓

REST API

↓

Service Layer

↓

AI Layer

↓

Storage Layer

↓

Vector Store
```

Every component should have a clearly defined responsibility. Avoid tightly coupling AI logic with business logic.

## Technology Stack

#### Backend

- Spring Boot
- REST APIs
- Async processing
- Dependency Injection

#### Frontend

- React

#### Storage

- SQLite initially
- PostgreSQL later

#### Vector Database

- FAISS

#### Inference

- Ollama

#### Embedding Models

- Local embedding models

#### Document Parsing

- PDF
- DOCX
- TXT
- Markdown

#### Deployment

- Docker

## Functional Requirements

### Document Upload

Support:

- PDF
- DOCX
- TXT
- Markdown

Future:

- HTML
- EPUB
- CSV

### Document Parsing

Extract:

- text
- headings
- metadata
- page numbers
- tables

Future:

- OCR
- image captions

### Chunking

Implement multiple chunking strategies.

Examples:

- Fixed length
- Recursive
- Sentence based
- Semantic chunking

Chunking strategy should be configurable.

### Embeddings

Generate embeddings locally. Support swapping embedding models without changing business logic.

### Vector Search

Support

- similarity search
- top-k retrieval
- configurable thresholds

### Hybrid Retrieval

Combine

- Vector search
- BM25

Re-rank retrieved chunks before sending them to the LLM.

### RAG Pipeline

Pipeline should look like:

```markdown
Question

↓

Retriever

↓

Re-ranking

↓

Context Builder

↓

Prompt Builder

↓

LLM

↓

Streaming Response
```

Always cite source documents.

### Question Answering

Support:

- single document
- multiple documents
- follow-up questions

Conversation history should improve future responses.

### Summarization

Provide:

- Executive summary
- Bullet summary
- Technical summary
- Action items
- FAQ generation

### Tool Calling

Support tools like:

- Calculator
- Date/time
- Web search
- Translation

The LLM should decide when to invoke tools.

### Streaming

- Responses should stream token-by-token.
- Support cancellation.

### Web UI

Modern web interface.

Features:

- Dark mode
- Markdown rendering
- Syntax highlighting
- Drag-and-drop upload
- Conversation sidebar
- Citation viewer
- Document explorer
- Search history

### Document Library

Display:

- upload date
- size
- pages
- indexing status
- embedding status

Support deleting documents.

### Search

Support:

- semantic search
- keyword search
- hybrid search

Allow filtering by document.

## Performance Requirements

Implement:

- embedding cache
- document hashing
- duplicate detection
- asynchronous indexing
- parallel parsing
- batching

Avoid recomputing embeddings.

## Logging

Use structured logging. Every request should log:

- latency
- retrieved chunks
- LLM duration
- embedding duration

## Configuration

Every configurable value should live in configuration.

Examples:

- model names
- chunk size
- overlap
- retrieval count
- temperature
- embedding model

Avoid hardcoding.

## Coding Standards

- Small focused classes
- Single Responsibility Principle
- Constructor Injection
- Comprehensive error handling
- Unit tests where practical
- Clear naming
- No duplicated logic
- Prefer composition over inheritance

## Non-Functional Goals

The application should:

- remain responsive during indexing
- support thousands of documents
- be modular
- be easy to extend
- support future cloud models
- support future multimodal models

## Future Roadmap

Potential future features:

- Image understanding
- Audio transcription
- Video indexing
- Agent workflows
- MCP integration
- Knowledge graphs
- Multi-agent collaboration
- Research mode
- Compare documents
- Version comparison
- Citation graphs
- Automatic tagging
- Local voice assistant
- Mobile client
- Plugin system

## Instructions for Codex

- Prioritize readability and maintainability over minimizing lines of code.
- Follow clean architecture and keep concerns separated.
- Before implementing a feature, explain the design, trade-offs, and proposed file structure.
- Keep commits small and focused on a single feature.
- Add concise comments where they clarify intent, not obvious behavior.
- Prefer well-supported libraries over reinventing standard functionality.
- When there are multiple implementation options, present the pros and cons before choosing one.
- Ensure every new feature includes appropriate tests where practical.
- Optimize for local execution with minimal memory usage.
- Favor extensibility so future capabilities (multimodal input, new vector stores, or cloud providers) can be added with minimal changes.