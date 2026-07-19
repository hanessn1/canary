package com.canary.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CanaryBackendApplicationTests {
	@Autowired private MockMvc mockMvc;

	@Test
	void contextLoads() {
		assertThat(mockMvc).isNotNull();
	}

	@Test
	void healthEndpointReturnsStandardSuccessResponse() throws Exception {
		mockMvc
				.perform(
						org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
								"/api/v1/health"))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
								.value(true))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
										"$.data.status")
								.value("UP"));
	}

	@Test
	void versionEndpointReturnsRuntimeMetadata() throws Exception {
		mockMvc
				.perform(
						org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
								"/api/v1/version"))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
								.value(true))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
										"$.data.applicationName")
								.value("Canary Backend"))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
										"$.data.javaVersion")
								.isNotEmpty());
	}

	@Test
	void unknownResourceReturnsStandardNotFoundResponse() throws Exception {
		mockMvc
				.perform(
						org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/favicon.ico"))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNotFound())
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success")
								.value(false))
				.andExpect(
						org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
										"$.error.code")
								.value("RESOURCE_NOT_FOUND"));
	}
}
