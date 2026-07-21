package com.canary.backend;

import static org.hamcrest.Matchers.containsString;

import com.canary.backend.client.ai.AiClient;
import com.canary.backend.service.DocumentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = "canary.documents.upload-directory=target/test-uploads")
@AutoConfigureMockMvc
class DocumentControllerIntegrationTests {
	private static final String DOCUMENTS_PATH = "/api/v1/documents";

	@MockitoBean
	private AiClient aiClient;

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;
	private final DocumentService documentService;

	@Autowired
	DocumentControllerIntegrationTests(MockMvc mockMvc, ObjectMapper objectMapper, DocumentService documentService) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
		this.documentService = documentService;
	}

	@AfterEach
	void removeUploadedDocuments() {
		documentService.findAll().forEach(document -> documentService.delete(document.id()));
	}

	@Test
	void uploadStoresMetadataAndReturnsCreatedDocument() throws Exception {
		UUID documentId = upload("notes.md", "text/markdown", "# Canary".getBytes());

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.get(DOCUMENTS_PATH + "/{documentId}", documentId))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
						.value(true))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
						.jsonPath("$.data.originalFilename").value("notes.md"))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.status")
						.value("UPLOADED"))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.checksum")
						.isNotEmpty());
	}

	@Test
	void uploadRejectsUnsupportedFileType() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", new byte[]{1, 2, 3});

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(DOCUMENTS_PATH)
				.file(file))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.error.code")
						.value("UNSUPPORTED_FILE_EXTENSION"));
	}

	@Test
	void uploadRejectsOversizedFile() throws Exception {
		byte[] content = new byte[10 * 1024 * 1024 + 1];
		MockMultipartFile file = new MockMultipartFile("file", "large.txt", "text/plain", content);

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(DOCUMENTS_PATH)
				.file(file))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isPayloadTooLarge())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.error.code")
						.value("FILE_TOO_LARGE"));
	}

	@Test
	void listingDocumentsIncludesUploadedDocument() throws Exception {
		UUID firstDocumentId = upload("first.txt", "text/plain", "first".getBytes());
		UUID secondDocumentId = upload("second.txt", "text/plain", "second".getBytes());

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(DOCUMENTS_PATH)
				.accept(MediaType.APPLICATION_JSON))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
						.value(true))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.length()")
						.value(2))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data[0].id")
						.value(secondDocumentId.toString()))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
						.string(containsString(firstDocumentId.toString())));
	}

	@Test
	void deleteRemovesDocumentMetadata() throws Exception {
		UUID documentId = upload("delete.md", "text/markdown", "remove me".getBytes());

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.delete(DOCUMENTS_PATH + "/{documentId}", documentId))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
						.value(true));

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.get(DOCUMENTS_PATH + "/{documentId}", documentId))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNotFound())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.error.code")
						.value("DOCUMENT_NOT_FOUND"));
	}

	@Test
	void fetchingUnknownDocumentReturnsNotFound() throws Exception {
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.get(DOCUMENTS_PATH + "/{documentId}", UUID.randomUUID()))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNotFound())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.error.code")
						.value("DOCUMENT_NOT_FOUND"));
	}

	private UUID upload(String filename, String contentType, byte[] content) throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", filename, contentType, content);
		MvcResult result = mockMvc
				.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(DOCUMENTS_PATH)
						.file(file))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
				.andReturn();
		JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
		return UUID.fromString(response.at("/data/id").asText());
	}
}
