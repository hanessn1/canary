package com.canary.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Immutable application metadata exposed by the version endpoint. */
@ConfigurationProperties(prefix = "canary.application")
public record ApplicationProperties(String name) {}
