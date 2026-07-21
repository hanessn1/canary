package com.canary.backend.service;

import com.canary.backend.config.DocumentStorageProperties;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Stores temporary upload bytes locally while calculating their SHA-256 checksum in one pass.
 */
@Service
public class LocalStorageService implements StorageService {
	private static final Logger LOGGER = LoggerFactory.getLogger(LocalStorageService.class);
	private static final int BUFFER_SIZE = 8192;

	private final Path uploadDirectory;

	public LocalStorageService(DocumentStorageProperties properties) {
		Path dir = properties.uploadDirectory().toAbsolutePath().normalize();
		// If running from backend/ subdirectory, shift storage up to the root level
		String backendPattern = "backend" + java.io.File.separator + "storage";
		if (dir.toString().contains(backendPattern)) {
			dir = Path.of(dir.toString().replace(backendPattern, "storage")).normalize();
		}
		this.uploadDirectory = dir;
		LOGGER.info("Configured local storage upload directory: {}", this.uploadDirectory);
	}

	@Override
	public StoredFile store(UUID documentId, String extension, InputStream content) throws IOException {
		Files.createDirectories(uploadDirectory);
		String filename = documentId + "." + extension;
		Path target = resolveStoragePath(filename);
		MessageDigest digest = sha256Digest();
		long sizeBytes = 0;

		try (InputStream input = content;
				OutputStream output = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW,
						StandardOpenOption.WRITE)) {
			byte[] buffer = new byte[BUFFER_SIZE];
			int bytesRead;
			while ((bytesRead = input.read(buffer)) != -1) {
				output.write(buffer, 0, bytesRead);
				digest.update(buffer, 0, bytesRead);
				sizeBytes += bytesRead;
			}
		}

		return new StoredFile(filename, sizeBytes, HexFormat.of().formatHex(digest.digest()));
	}

	@Override
	public void delete(String filename) throws IOException {
		Files.deleteIfExists(resolveStoragePath(filename));
	}

	private Path resolveStoragePath(String filename) {
		Path path = uploadDirectory.resolve(filename).normalize();
		if (!path.startsWith(uploadDirectory)) {
			throw new IllegalArgumentException("Storage filename resolves outside the configured upload directory");
		}
		return path;
	}

	private MessageDigest sha256Digest() {
		try {
			return MessageDigest.getInstance("SHA-256");
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}
}
