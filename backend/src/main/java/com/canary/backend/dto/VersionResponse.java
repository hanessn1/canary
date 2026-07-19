package com.canary.backend.dto;

/** Build and runtime metadata returned by the version endpoint. */
public record VersionResponse(
    String applicationName, String version, String buildTimestamp, String javaVersion) {}
