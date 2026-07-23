# Low-Level Design (LLD) — RAG Pipeline Execution Flow

This document details the exact sequence of operations during a Retrieval-Augmented Generation (RAG) streaming chat query in Canary, matching the codebase execution in `ChatContext.jsx`, `ChatController.java`, `HttpAiClient.java`, `ai/main.py`, `retriever.py`, and `chat.py`.

## Precise RAG Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Web UI
    participant ChatContext as ChatContext (React)
    participant ApiClient as chatApi / fetch
    participant Backend as ChatController (Spring Boot)
    participant AiClient as HttpAiClient
    participant FastAPI as FastAPI (/api/v1/chat)
    participant ChatService as ChatService (Python)
    participant Retriever as Retriever (FAISS + BM25)
    participant Ollama as Ollama API (/api/chat)

    User->>ChatContext: sendMessage(prompt, documentIds)
    ChatContext->>ChatContext: Create User & Assistant Placeholder Messages in State
    ChatContext->>ApiClient: chatStream(prompt, documentIds, history, temperature, topK, similarityThreshold)
    ApiClient->>Backend: POST /api/v1/chat/stream (JSON)
    Backend->>AiClient: chatStream(request, lineConsumer)
    AiClient->>FastAPI: POST /api/v1/chat (stream: true)
    
    FastAPI->>ChatService: classify_intent(query)
    ChatService-->>FastAPI: returns needs_retrieval (boolean)

    alt needs_retrieval is True AND document_ids is non-empty
        FastAPI->>Retriever: retrieve(query, document_ids, top_k, similarity_threshold)
        Retriever->>Ollama: get_embedding(query) via Embedder
        Ollama-->>Retriever: query_vector
        Retriever->>Retriever: Load FAISS Index (.index) & Chunks (.json) from storage/vectors/
        Retriever->>Retriever: FAISS index.search(query_np, top_k)
        Retriever->>Retriever: Filter chunks where score >= similarity_threshold
        Retriever->>Retriever: Compute BM25Okapi scores over candidates
        Retriever->>Retriever: Compute hybrid_score = 0.7 * score + 0.3 * norm_bm25
        Retriever->>Retriever: Sort candidates descending & slice top_k
        Retriever-->>FastAPI: returns retrieved chunks with page metadata
    else Conversational Query or No Documents
        FastAPI->>FastAPI: chunks = []
    end

    FastAPI->>ChatService: generate_response(query, chunks, history, stream=True, temperature)
    ChatService->>ChatService: Assemble System Prompt (Context + Page Citation Rules or General Assistant)
    ChatService->>ChatService: Construct messages = [system, ...history, user]
    
    ChatService-->>FastAPI: yield SSE {"citations": context_chunks}
    FastAPI-->>AiClient: SSE {"citations": [...]}
    AiClient-->>Backend: lineConsumer.accept(line)
    Backend-->>ApiClient: SseEmitter.send(data: {"citations": [...]})
    ApiClient-->>ChatContext: onCitations(citations) -> Updates Citation Badges in UI

    loop Stream Tokens from Ollama
        ChatService->>Ollama: POST /api/chat (stream: true, messages, tools)
        Ollama-->>ChatService: Token Chunks / Tool Calls
        opt Tool Call Triggered by Model
            ChatService->>ChatService: execute_tool(name, arguments)
            ChatService->>Ollama: POST /api/chat with tool response
        end
        ChatService-->>FastAPI: yield SSE {"content": chunk, "done": false}
        FastAPI-->>AiClient: SSE {"content": chunk, "done": false}
        AiClient-->>Backend: lineConsumer.accept(line)
        Backend-->>ApiClient: SseEmitter.send(data: {"content": chunk})
        ApiClient-->>ChatContext: onChunk(chunk) -> Appends Text to Assistant Message
        ChatContext-->>User: Re-renders UI token by token
    end
```

## Detailed Component Logic Breakdown

### 1. Intent Classification (`ChatService.classify_intent`)
Located in `ai/services/chat.py`. Analyzes the query string for standard greetings ("hi", "hello", "who are you"). If the query is conversational and contains no document references, retrieval is bypassed to minimize response latency.

### 2. Single-Pass Hybrid Retrieval (`Retriever.retrieve`)
Located in `ai/services/retriever.py`. Combines dense vector retrieval and sparse keyword re-ranking in a single execution method:

1. **Embedding Query**: Obtains query embedding vector via `Embedder` (`nomic-embed-text`) and normalizes it with `faiss.normalize_L2()`.
2. **FAISS Dense Search**: Loads binary FAISS indices (`.index`) and chunk JSON metadata (`.json`) from `storage/vectors/` for each selected `document_id`. Performs inner product search (`index.search`) and filters out candidates below `similarity_threshold` (default `0.35`).
3. **BM25 Keyword Re-Ranking**: Tokenizes retrieved candidates and query text using `BM25Okapi`.
4. **Hybrid Combination**: Calculates combined score:
   $$\text{Score}_{\text{combined}} = 0.7 \cdot \text{Score}_{\text{FAISS}} + 0.3 \cdot \text{Score}_{\text{BM25\_normalized}}$$
5. **Sorting & Slicing**: Sorts by `combined_score` descending and returns top `top_k` chunks.

### 3. Prompt Construction & Citation Enforcement (`ChatService.generate_response`)
Located in `ai/services/chat.py`.
- Formats context chunks into `--- START CONTEXT ---` blocks marked with `[Page: <N>]`.
- Adds system instructions ordering the model to cite page numbers strictly using `[Page <N>]`.
- Appends conversation history messages `[{role, content}]`.

### 4. SSE Stream Delivery (`api.js` & `ChatController.java`)
- First yields JSON citations `{"citations": [...]}` so citation badges render immediately in the UI.
- Next streams token chunks `{"content": "..."}` as Ollama emits tokens.
- Supports tool execution loop (`get_system_time`, `list_documents`, `search_documents`).
