package com.canary.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Registers MVC-wide web concerns without coupling them to individual controllers. */
@Configuration
public class WebConfiguration implements WebMvcConfigurer {
	private final RequestLoggingInterceptor requestLoggingInterceptor;

	public WebConfiguration(RequestLoggingInterceptor requestLoggingInterceptor) {
		this.requestLoggingInterceptor = requestLoggingInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(requestLoggingInterceptor);
	}
}
