package com.canary.backend.exception;

import com.canary.backend.dto.ApiError;
import com.canary.backend.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Converts expected validation failures and unexpected errors into the standard API envelope. */
@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);
	private final Clock clock;

	public GlobalExceptionHandler(Clock clock) {
		this.clock = clock;
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
		Map<String, String> errors = new LinkedHashMap<>();
		exception
				.getBindingResult()
				.getFieldErrors()
				.forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
		return errorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", errors);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException exception) {
		Map<String, String> errors = new LinkedHashMap<>();
		exception
				.getConstraintViolations()
				.forEach(
						violation ->
								errors.put(violation.getPropertyPath().toString(), violation.getMessage()));
		return errorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", errors);
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleMissingResource(NoResourceFoundException exception) {
		return errorResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Resource not found", Map.of());
	}

	@ExceptionHandler(DocumentNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleDocumentNotFound(DocumentNotFoundException exception) {
		return errorResponse(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND", exception.getMessage(), Map.of());
	}

	@ExceptionHandler(InvalidDocumentUploadException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidDocumentUpload(InvalidDocumentUploadException exception) {
		HttpStatus status = "FILE_TOO_LARGE".equals(exception.getCode())
				? HttpStatus.PAYLOAD_TOO_LARGE
				: HttpStatus.BAD_REQUEST;
		return errorResponse(status, exception.getCode(), exception.getMessage(), Map.of());
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiResponse<Void>> handleMaximumUploadSizeExceeded(MaxUploadSizeExceededException exception) {
		return errorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "The file exceeds the configured maximum upload size", Map.of());
	}

	@ExceptionHandler(DocumentStorageException.class)
	public ResponseEntity<ApiResponse<Void>> handleDocumentStorage(DocumentStorageException exception) {
		LOGGER.error("Document storage failure", exception);
		return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "DOCUMENT_STORAGE_ERROR", "Unable to process document storage", Map.of());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception) {
		LOGGER.error("Unhandled request failure", exception);
		return errorResponse(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"INTERNAL_ERROR",
				"An unexpected error occurred",
				Map.of());
	}

	private ResponseEntity<ApiResponse<Void>> errorResponse(
			HttpStatus status, String code, String message, Map<String, String> details) {
		ApiError error = new ApiError(code, message, Map.copyOf(details));
		ApiResponse<Void> body = new ApiResponse<>(false, null, error, Instant.now(clock));
		return ResponseEntity.status(status)
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.body(body);
	}
}
