package com.canary.backend.service;

import com.canary.backend.domain.document.Document;
import com.canary.backend.domain.document.DocumentStatus;
import com.canary.backend.exception.DocumentNotFoundException;
import com.canary.backend.exception.DocumentStorageException;
import com.canary.backend.repository.DocumentRepository;
import com.canary.backend.validation.document.DocumentUploadValidator;
import com.canary.backend.validation.document.ValidatedDocumentUpload;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Coordinates document metadata, temporary storage, and lifecycle operations.
 */
@Service
public class DocumentService {
	private static final Logger LOGGER = LoggerFactory.getLogger(DocumentService.class);

	private final DocumentRepository documentRepository;
	private final StorageService storageService;
	private final DocumentUploadValidator uploadValidator;
	private final Clock clock;

	public DocumentService(DocumentRepository documentRepository, StorageService storageService,
			DocumentUploadValidator uploadValidator, Clock clock) {
		this.documentRepository = documentRepository;
		this.storageService = storageService;
		this.uploadValidator = uploadValidator;
		this.clock = clock;
	}

	public Document upload(MultipartFile file) {
		ValidatedDocumentUpload upload = uploadValidator.validate(file);
		UUID documentId = UUID.randomUUID();
		StoredFile storedFile = store(documentId, upload, file);
		Document document = new Document(documentId, storedFile.filename(), upload.originalFilename(),
				upload.contentType(), storedFile.sizeBytes(), Instant.now(clock), DocumentStatus.UPLOADED,
				storedFile.checksum(), null, Map.of());

		try {
			Document savedDocument = documentRepository.save(document);
			LOGGER.info(
					"Document uploaded: documentId={}, originalFilename={}, contentType={}, sizeBytes={}, status={}",
					savedDocument.id(), savedDocument.originalFilename(), savedDocument.contentType(),
					savedDocument.sizeBytes(), savedDocument.status());

			// Future: publish a document-uploaded event to trigger asynchronous parsing and RAG processing.
			return savedDocument;
		} catch (RuntimeException exception) {
			deleteStoredFileAfterFailedPersistence(storedFile.filename());
			throw exception;
		}
	}

	public List<Document> findAll() {
		return documentRepository.findAll()
			.stream()
			.sorted(Comparator.comparing(Document::uploadedAt).reversed())
			.toList();
	}

	public Document findById(UUID documentId) {
		return documentRepository.findById(documentId).orElseThrow(() -> new DocumentNotFoundException(documentId));
	}

	public Document delete(UUID documentId) {
		Document document = findById(documentId);
		try {
			storageService.delete(document.filename());
		} catch (IOException exception) {
			throw new DocumentStorageException("Unable to remove the document from temporary storage", exception);
		}
		return documentRepository.deleteById(documentId).orElseThrow(() -> new DocumentNotFoundException(documentId));
	}

	private StoredFile store(UUID documentId, ValidatedDocumentUpload upload, MultipartFile file) {
		try {
			return storageService.store(documentId, upload.extension(), file.getInputStream());
		} catch (IOException exception) {
			throw new DocumentStorageException("Unable to store the uploaded document", exception);
		}
	}

	private void deleteStoredFileAfterFailedPersistence(String filename) {
		try {
			storageService.delete(filename);
		} catch (IOException cleanupException) {
			LOGGER.warn("Could not clean up temporary document storage after persistence failure", cleanupException);
		}
	}
}
