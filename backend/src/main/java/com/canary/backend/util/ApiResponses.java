package com.canary.backend.util;

import com.canary.backend.dto.ApiResponse;
import java.time.Instant;

/** Factory methods for successful standard API response envelopes. */
public final class ApiResponses {
	private ApiResponses() {}

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, data, null, Instant.now());
	}
}
