package com.canary.backend.config;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.nio.file.Path;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/** Configuration governing document uploads and temporary local storage. */
@Validated
@ConfigurationProperties(prefix = "canary.documents")
public record DocumentStorageProperties(
	@NotNull Path uploadDirectory,
	@NotNull DataSize maxUploadSize,
	@NotEmpty Set<String> allowedContentTypes,
	@NotEmpty Set<String> allowedExtensions) {
}
