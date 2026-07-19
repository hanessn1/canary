package com.canary.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Logs a concise completion record for every MVC request without logging request bodies. */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {
	private static final Logger LOGGER = LoggerFactory.getLogger(RequestLoggingInterceptor.class);
	private static final String START_TIME_ATTRIBUTE = RequestLoggingInterceptor.class.getName() + ".startTime";
	private final Clock clock;

	public RequestLoggingInterceptor(Clock clock) {
		this.clock = clock;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		request.setAttribute(START_TIME_ATTRIBUTE, Instant.now(clock));
		return true;
	}

	@Override
	public void afterCompletion(
			HttpServletRequest request,
			HttpServletResponse response,
			Object handler,
			Exception exception) {
		Instant startTime = (Instant) request.getAttribute(START_TIME_ATTRIBUTE);
		long durationMillis = startTime == null ? 0 : Duration.between(startTime, Instant.now(clock)).toMillis();
		LOGGER.info(
				"Request completed: method={}, path={}, status={}, durationMs={}",
				request.getMethod(),
				request.getRequestURI(),
				response.getStatus(),
				durationMillis
		);
	}
}
