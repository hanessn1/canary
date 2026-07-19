package com.canary.backend.domain.document;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Document metadata owned by the backend; it intentionally contains no
 * filesystem path or content.
 */
public record Document(
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

	public Document {
		metadata = Map.copyOf(metadata);
	}
}
