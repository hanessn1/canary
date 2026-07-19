package com.canary.backend.service;

/**
 * Safe metadata returned after a file is stored; no absolute path is exposed.
 */
public record StoredFile(String filename, long sizeBytes, String checksum) {
}
