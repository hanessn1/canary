package com.canary.backend.repository;

import com.canary.backend.domain.document.Document;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence port for document metadata, independent of a particular database.
 */
public interface DocumentRepository {

	Document save(Document document);

	List<Document> findAll();

	Optional<Document> findById(UUID id);

	Optional<Document> deleteById(UUID id);
}
