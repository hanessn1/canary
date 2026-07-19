package com.canary.backend.dto.document;

import com.canary.backend.domain.document.DocumentStatus;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Client-safe representation of a document and its lifecycle metadata. */
public record DocumentResponse(
	UUID id,
	String filename,
	String originalFilename,
	String contentType,
	long sizeBytes,
	Instant uploadedAt,
	DocumentStatus status,
	String checksum,
	Integer pageCount,
	Map<String, String> metadata) {
}
