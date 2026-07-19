package com.canary.backend.service;

import com.canary.backend.dto.HealthResponse;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;

/** Produces the public API health representation. */
@Service
public class HealthService {
	private final Clock clock;

	public HealthService(Clock clock) {
		this.clock = clock;
	}

	public HealthResponse getHealth() {
		return new HealthResponse("UP", Instant.now(clock));
	}
}
