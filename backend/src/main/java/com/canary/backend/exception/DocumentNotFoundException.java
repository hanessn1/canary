package com.canary.backend.exception;

import java.util.UUID;

/**
 * Raised when a document identifier is not present in the metadata repository.
 */
public class DocumentNotFoundException extends RuntimeException {

	public DocumentNotFoundException(UUID documentId) {
		super("Document not found: " + documentId);
	}
}
