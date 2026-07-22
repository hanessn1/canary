package com.canary.backend.client.ai;

import com.canary.backend.dto.chat.ChatRequest;
import com.canary.backend.dto.chat.ChatResponse;

import java.util.UUID;
import java.util.function.Consumer;

/**
 * Boundary for the top-level AI module. Implementations such as local or Ollama clients belong in
 * future work and must not leak AI-provider concerns into the backend domain.
 */
public interface AiClient {

	void indexDocument(UUID documentId, String filename);

	void deleteDocumentIndex(UUID documentId);

	ChatResponse chat(ChatRequest request);

	void chatStream(ChatRequest request, Consumer<String> chunkConsumer);

	java.util.List<String> getModels();
}
