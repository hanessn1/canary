package com.canary.backend.controller;

import com.canary.backend.client.ai.AiClient;
import com.canary.backend.dto.ApiResponse;
import com.canary.backend.dto.chat.ChatRequest;
import com.canary.backend.dto.chat.ChatResponse;
import com.canary.backend.util.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

	private final AiClient aiClient;

	public ChatController(AiClient aiClient) {
		this.aiClient = aiClient;
	}

	@PostMapping
	public ResponseEntity<ApiResponse<ChatResponse>> chat(@RequestBody @Valid ChatRequest request) {
		ChatResponse response = aiClient.chat(request);
		return ResponseEntity.ok(ApiResponses.success(response));
	}

	@PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamChat(@RequestBody @Valid ChatRequest request) {
		SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout

		java.util.concurrent.CompletableFuture.runAsync(() -> {
			try {
				aiClient.chatStream(request, line -> {
					try {
						emitter.send(SseEmitter.event().data(line));
					} catch (Exception ex) {
						emitter.completeWithError(ex);
					}
				});
				emitter.complete();
			} catch (Exception ex) {
				try {
					String safeMsg = ex.getMessage() != null ? ex.getMessage().replace("\"", "'") : "AI service unavailable";
					emitter.send(SseEmitter.event().data("{\"content\": \"Error: " + safeMsg + "\", \"done\": true}"));
				} catch (Exception ignore) {}
				emitter.complete();
			}
		});

		return emitter;
	}

	@GetMapping("/models")
	public ResponseEntity<ApiResponse<List<String>>> getModels() {
		List<String> models = aiClient.getModels();
		return ResponseEntity.ok(ApiResponses.success(models));
	}
}
