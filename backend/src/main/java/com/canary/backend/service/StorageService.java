package com.canary.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * Storage port for upload bytes, replaceable with S3, MinIO, or another storage provider.
 */
public interface StorageService {

	StoredFile store(UUID documentId, String extension, InputStream content) throws IOException;

	void delete(String filename) throws IOException;
}
