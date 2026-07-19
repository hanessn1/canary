package com.canary.backend.validation.document;

import com.canary.backend.config.DocumentStorageProperties;
import com.canary.backend.exception.InvalidDocumentUploadException;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Centralizes file size, MIME type, and extension validation for document uploads.
 */
@Component
public class DocumentUploadValidator {
	private final DocumentStorageProperties properties;

	public DocumentUploadValidator(DocumentStorageProperties properties) {
		this.properties = properties;
	}

	public ValidatedDocumentUpload validate(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new InvalidDocumentUploadException("EMPTY_FILE", "A non-empty file is required");
		}
		if (file.getSize() > properties.maxUploadSize().toBytes()) {
			throw new InvalidDocumentUploadException("FILE_TOO_LARGE", "The file exceeds the configured maximum upload size");
		}

		String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
		String extension = extractExtension(originalFilename);
		String contentType = normalizeContentType(file.getContentType());

		if (!properties.allowedExtensions().contains(extension)) {
			throw new InvalidDocumentUploadException("UNSUPPORTED_FILE_EXTENSION", "The file extension is not supported");
		}
		if (!properties.allowedContentTypes().contains(contentType)) {
			throw new InvalidDocumentUploadException("UNSUPPORTED_MEDIA_TYPE", "The file content type is not supported");
		}
		return new ValidatedDocumentUpload(originalFilename, contentType, extension);
	}

	private String extractExtension(String originalFilename) {
		if (!StringUtils.hasText(originalFilename) || originalFilename.contains("..")) {
			throw new InvalidDocumentUploadException("INVALID_FILENAME", "A valid filename is required");
		}
		String extension = StringUtils.getFilenameExtension(originalFilename);
		if (!StringUtils.hasText(extension)) {
			throw new InvalidDocumentUploadException("UNSUPPORTED_FILE_EXTENSION", "The file must have a supported extension");
		}
		return extension.toLowerCase(Locale.ROOT);
	}

	private String normalizeContentType(String contentType) {
		return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
	}
}
