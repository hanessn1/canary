package com.canary.backend.dto;

import java.time.Instant;

/** Common response envelope for all public REST endpoints. */
public record ApiResponse<T>(boolean success, T data, ApiError error, Instant timestamp) {}
