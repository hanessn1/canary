package com.canary.backend.service;

import com.canary.backend.config.ApplicationProperties;
import com.canary.backend.dto.VersionResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.stereotype.Service;

/** Supplies version information without binding controllers to Spring's build metadata type. */
@Service
public class VersionService {
	private static final String UNKNOWN = "unknown";

	private final ApplicationProperties applicationProperties;
	private final ObjectProvider<BuildProperties> buildPropertiesProvider;

	public VersionService(ApplicationProperties applicationProperties, ObjectProvider<BuildProperties> buildPropertiesProvider) {
		this.applicationProperties = applicationProperties;
		this.buildPropertiesProvider = buildPropertiesProvider;
	}

	public VersionResponse getVersion() {
		BuildProperties buildProperties = buildPropertiesProvider.getIfAvailable();
		return new VersionResponse(
				applicationProperties.name(),
				buildProperties == null ? UNKNOWN : buildProperties.getVersion(),
				buildProperties == null ? UNKNOWN : buildProperties.getTime().toString(),
				System.getProperty("java.version")
		);
	}
}
