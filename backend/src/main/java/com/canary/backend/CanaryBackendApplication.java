package com.canary.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** Entry point for the Canary backend application. */
@SpringBootApplication
@ConfigurationPropertiesScan
public class CanaryBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CanaryBackendApplication.class, args);
	}
}
