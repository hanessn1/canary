package com.canary.backend.controller;

import com.canary.backend.dto.ApiResponse;
import com.canary.backend.dto.document.DocumentResponse;
import com.canary.backend.mapper.DocumentMapper;
import com.canary.backend.service.DocumentService;
import com.canary.backend.util.ApiResponses;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** REST API for document upload metadata and lifecycle operations. */
@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {
	private final DocumentService documentService;
	private final DocumentMapper documentMapper;

	public DocumentController(DocumentService documentService, DocumentMapper documentMapper) {
		this.documentService = documentService;
		this.documentMapper = documentMapper;
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<DocumentResponse>> upload(@RequestPart("file") MultipartFile file) {
		DocumentResponse response = documentMapper.toResponse(documentService.upload(file));
		URI location = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/{id}").buildAndExpand(response.id()).toUri();
		return ResponseEntity.created(location).body(ApiResponses.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<DocumentResponse>>> findAll() {
		List<DocumentResponse> documents = documentService.findAll().stream().map(documentMapper::toResponse).toList();
		return ResponseEntity.ok(ApiResponses.success(documents));
	}

	@GetMapping("/{documentId}")
	public ResponseEntity<ApiResponse<DocumentResponse>> findById(@PathVariable UUID documentId) {
		return ResponseEntity.ok(ApiResponses.success(documentMapper.toResponse(documentService.findById(documentId))));
	}

	@DeleteMapping("/{documentId}")
	public ResponseEntity<ApiResponse<DocumentResponse>> delete(@PathVariable UUID documentId) {
		return ResponseEntity.ok(ApiResponses.success(documentMapper.toResponse(documentService.delete(documentId))));
	}
}
