package com.canary.backend.repository;

import com.canary.backend.domain.document.Document;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

/**
 * Persistent local development repository using a JSON metadata file database.
 */
@Repository
public class InMemoryDocumentRepository implements DocumentRepository {
	private static final Logger LOGGER = LoggerFactory.getLogger(InMemoryDocumentRepository.class);

	private final Path metadataPath;
	private final ObjectMapper objectMapper;
	private final ConcurrentMap<UUID, Document> documents = new ConcurrentHashMap<>();

	public InMemoryDocumentRepository(com.canary.backend.config.DocumentStorageProperties properties, ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		Path dir = properties.uploadDirectory().toAbsolutePath().normalize();
		// If running from backend/ subdirectory, shift storage up to the root level
		String backendPattern = "backend" + java.io.File.separator + "storage";
		if (dir.toString().contains(backendPattern)) {
			dir = Path.of(dir.toString().replace(backendPattern, "storage")).normalize();
		}
		this.metadataPath = dir.getParent().resolve("documents.json");
		loadMetadata();
	}

	@Override
	public Document save(Document document) {
		documents.put(document.id(), document);
		saveMetadata();
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
		Optional<Document> doc = Optional.ofNullable(documents.remove(id));
		if (doc.isPresent()) {
			saveMetadata();
		}
		return doc;
	}

	private void loadMetadata() {
		if (!Files.exists(metadataPath)) {
			LOGGER.info("No documents metadata database found at: {}", metadataPath);
			return;
		}
		try {
			List<Document> list = objectMapper.readValue(
				metadataPath.toFile(),
				new TypeReference<List<Document>>() {}
			);
			for (Document doc : list) {
				documents.put(doc.id(), doc);
			}
			LOGGER.info("Loaded {} documents from metadata database at {}", documents.size(), metadataPath);
		} catch (Exception e) {
			LOGGER.error("Failed to load documents metadata from disk", e);
		}
	}

	private void saveMetadata() {
		try {
			Files.createDirectories(metadataPath.getParent());
			objectMapper.writeValue(metadataPath.toFile(), List.copyOf(documents.values()));
			LOGGER.info("Saved documents metadata database to {}", metadataPath);
		} catch (Exception e) {
			LOGGER.error("Failed to save documents metadata to disk", e);
		}
	}
}
