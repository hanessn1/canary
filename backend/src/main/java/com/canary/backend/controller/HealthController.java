package com.canary.backend.controller;

import com.canary.backend.dto.ApiResponse;
import com.canary.backend.dto.HealthResponse;
import com.canary.backend.service.HealthService;
import com.canary.backend.util.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public application health endpoint, distinct from the operational Actuator endpoint. */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
	private final HealthService healthService;

	public HealthController(HealthService healthService) {
		this.healthService = healthService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<HealthResponse>> health() {
		return ResponseEntity.ok(ApiResponses.success(healthService.getHealth()));
	}
}
