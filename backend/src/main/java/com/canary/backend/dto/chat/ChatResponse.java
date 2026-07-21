package com.canary.backend.dto.chat;

import java.util.List;
import java.util.Map;

public record ChatResponse(
	String message,
	List<Map<String, Object>> citations
) {
}
