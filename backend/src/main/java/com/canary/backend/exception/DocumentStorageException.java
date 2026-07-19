package com.canary.backend.exception;

/** Raised when temporary document storage cannot complete an operation. */
public class DocumentStorageException extends RuntimeException {

	public DocumentStorageException(String message, Throwable cause) {
		super(message, cause);
	}
}
