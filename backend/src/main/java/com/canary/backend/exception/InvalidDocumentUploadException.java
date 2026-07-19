package com.canary.backend.exception;

/** Raised when an uploaded document fails the centralized upload policy. */
public class InvalidDocumentUploadException extends RuntimeException {
	private final String code;

	public InvalidDocumentUploadException(String code, String message) {
		super(message);
		this.code = code;
	}

	public String getCode() {
		return code;
	}
}
