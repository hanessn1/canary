package com.canary.backend.client.ai;

import com.canary.backend.config.AiServiceProperties;
import com.canary.backend.domain.document.Document;
import com.canary.backend.domain.document.DocumentStatus;
import com.canary.backend.dto.chat.ChatRequest;
import com.canary.backend.dto.chat.ChatResponse;
import com.canary.backend.repository.DocumentRepository;

import java.net.http.HttpClient;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class HttpAiClient implements AiClient {

	private static final Logger LOGGER = LoggerFactory.getLogger(HttpAiClient.class);
	private final RestClient restClient;
	private final DocumentRepository documentRepository;

	public HttpAiClient(RestClient.Builder restClientBuilder, AiServiceProperties properties, DocumentRepository documentRepository) {
		HttpClient httpClient = HttpClient.newBuilder()
			.version(HttpClient.Version.HTTP_1_1)
			.build();

		this.restClient = restClientBuilder
			.baseUrl(properties.serviceUrl())
			.requestFactory(new JdkClientHttpRequestFactory(httpClient))
			.requestInterceptor((request, body, execution) -> {
				LOGGER.info("Outbound request to AI service: URI={}, method={}, headers={}, body={}",
					request.getURI(),
					request.getMethod(),
					request.getHeaders(),
					new String(body, java.nio.charset.StandardCharsets.UTF_8));
				return execution.execute(request, body);
			})
			.build();
		this.documentRepository = documentRepository;
	}

	@Async
	@Override
	public void indexDocument(UUID documentId, String filename) {
		LOGGER.info("Requesting asynchronous indexing for documentId={}, filename={}", documentId, filename);

		updateDocumentStatus(documentId, DocumentStatus.PROCESSING);

		try {
			restClient.post()
				.uri("/api/v1/index")
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of(
					"document_id", documentId.toString(),
					"filename", filename
				))
				.retrieve()
				.toBodilessEntity();

			LOGGER.info("Successfully completed indexing for documentId={}", documentId);
			updateDocumentStatus(documentId, DocumentStatus.READY);
		} catch (Exception e) {
			LOGGER.error("Failed to index document: documentId={}", documentId, e);
			updateDocumentStatus(documentId, DocumentStatus.FAILED);
		}
	}

	@Override
	public void deleteDocumentIndex(UUID documentId) {
		LOGGER.info("Requesting deletion of vector index for documentId={}", documentId);
		try {
			restClient.delete()
				.uri("/api/v1/index/{documentId}", documentId.toString())
				.retrieve()
				.toBodilessEntity();
			LOGGER.info("Successfully deleted vector index for documentId={}", documentId);
		} catch (Exception e) {
			LOGGER.warn("Failed to delete document vector index: documentId={}", documentId, e);
		}
	}

	@Override
	public ChatResponse chat(ChatRequest request) {
		LOGGER.info("Sending chat request to AI service: query='{}', documents={}", request.query(), request.documentIds());
		try {
			Map<String, Object> body = new HashMap<>();
			body.put("query", request.query());
			body.put("document_ids", request.documentIds() != null ? request.documentIds().stream().map(UUID::toString).toList() : java.util.List.of());
			body.put("history", request.history() != null ? request.history() : java.util.List.of());
			body.put("stream", false);
			if (request.temperature() != null) {
				body.put("temperature", request.temperature());
			}
			if (request.topK() != null) {
				body.put("top_k", request.topK());
			}
			if (request.similarityThreshold() != null) {
				body.put("similarity_threshold", request.similarityThreshold());
			}

			return restClient.post()
				.uri("/api/v1/chat")
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.retrieve()
				.body(ChatResponse.class);
		} catch (Exception e) {
			LOGGER.error("Failed to call AI service chat endpoint", e);
			throw new RuntimeException("AI service chat call failed", e);
		}
	}

	@Override
	public void chatStream(ChatRequest request, Consumer<String> chunkConsumer) {
		LOGGER.info("Sending streaming chat request to AI service: query='{}', documents={}", request.query(), request.documentIds());
		try {
			Map<String, Object> body = new HashMap<>();
			body.put("query", request.query());
			body.put("document_ids", request.documentIds() != null ? request.documentIds().stream().map(UUID::toString).toList() : java.util.List.of());
			body.put("history", request.history() != null ? request.history() : java.util.List.of());
			body.put("stream", true);
			if (request.temperature() != null) {
				body.put("temperature", request.temperature());
			}
			if (request.topK() != null) {
				body.put("top_k", request.topK());
			}
			if (request.similarityThreshold() != null) {
				body.put("similarity_threshold", request.similarityThreshold());
			}

			restClient.post()
				.uri("/api/v1/chat")
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.exchange((req, res) -> {
					try (java.io.BufferedReader reader = new java.io.BufferedReader(
							new java.io.InputStreamReader(res.getBody(), java.nio.charset.StandardCharsets.UTF_8))) {
						String line;
						while ((line = reader.readLine()) != null) {
							chunkConsumer.accept(line);
						}
					}
					return null;
				});
		} catch (Exception e) {
			LOGGER.error("Failed to execute streaming chat", e);
			throw new RuntimeException("AI service streaming chat call failed", e);
		}
	}

	@Override
	public java.util.List<String> getModels() {
		try {
			java.util.Map<String, Object> response = restClient.get()
				.uri("/api/v1/models")
				.retrieve()
				.body(new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {});
			if (response != null && ("success".equals(response.get("status")) || "fallback".equals(response.get("status")))) {
				return (java.util.List<String>) response.get("models");
			}
		} catch (Exception e) {
			LOGGER.warn("Failed to fetch models from AI service: {}", e.getMessage());
		}
		return java.util.List.of("qwen2.5:3b", "nomic-embed-text");
	}



	private void updateDocumentStatus(UUID documentId, DocumentStatus status) {
		documentRepository.findById(documentId).ifPresent(doc -> {
			Document updatedDoc = new Document(
				doc.id(),
				doc.filename(),
				doc.originalFilename(),
				doc.contentType(),
				doc.sizeBytes(),
				doc.uploadedAt(),
				status,
				doc.checksum(),
				doc.pageCount(),
				doc.metadata()
			);
			documentRepository.save(updatedDoc);
			LOGGER.info("Updated documentId={} status to {}", documentId, status);
		});
	}
}
