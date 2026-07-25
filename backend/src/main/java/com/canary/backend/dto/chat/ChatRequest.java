package com.canary.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record ChatRequest(
	@NotBlank String query,
	List<UUID> documentIds,
	List<ChatMessage> history,
	Double temperature,
	Integer topK,
	Double similarityThreshold,
	String model
) {
}
