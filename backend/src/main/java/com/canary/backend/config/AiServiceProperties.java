package com.canary.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "canary.ai")
public record AiServiceProperties(String serviceUrl) {
}
