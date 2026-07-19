package com.canary.backend.dto;

import java.time.Instant;

/** Payload returned by the public health endpoint. */
public record HealthResponse(String status, Instant timestamp) {}
