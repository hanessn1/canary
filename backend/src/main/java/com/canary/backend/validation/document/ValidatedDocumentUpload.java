package com.canary.backend.validation.document;

/**
 * Normalized upload values approved by the centralized document upload validator.
 */
public record ValidatedDocumentUpload(String originalFilename, String contentType, String extension) {}
