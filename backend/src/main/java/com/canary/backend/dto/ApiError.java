package com.canary.backend.dto;

import java.util.Map;

/** Machine-readable and client-safe details for a failed API request. */
public record ApiError(String code, String message, Map<String, String> details) {}
