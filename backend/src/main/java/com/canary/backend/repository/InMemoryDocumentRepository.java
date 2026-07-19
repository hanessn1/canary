package com.canary.backend.repository;

import com.canary.backend.domain.document.Document;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Repository;

/**
 * Thread-safe development repository; replace this adapter without changing document services.
 */
@Repository
public class InMemoryDocumentRepository implements DocumentRepository {
	private final ConcurrentMap<UUID, Document> documents = new ConcurrentHashMap<>();

	@Override
	public Document save(Document document) {
		documents.put(document.id(), document);
		return document;
	}

	@Override
	public List<Document> findAll() {
		return List.copyOf(documents.values());
	}

	@Override
	public Optional<Document> findById(UUID id) {
		return Optional.ofNullable(documents.get(id));
	}

	@Override
	public Optional<Document> deleteById(UUID id) {
		return Optional.ofNullable(documents.remove(id));
	}
}
