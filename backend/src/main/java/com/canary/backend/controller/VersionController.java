package com.canary.backend.controller;

import com.canary.backend.dto.ApiResponse;
import com.canary.backend.dto.VersionResponse;
import com.canary.backend.service.VersionService;
import com.canary.backend.util.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Exposes non-sensitive application build metadata for diagnostics. */
@RestController
@RequestMapping("/api/v1/version")
public class VersionController {
	private final VersionService versionService;

	public VersionController(VersionService versionService) {
		this.versionService = versionService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<VersionResponse>> version() {
		return ResponseEntity.ok(ApiResponses.success(versionService.getVersion()));
	}
}
