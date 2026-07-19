package com.canary.backend.client.ai;

/**
 * Boundary for future communication with the top-level AI module or a local AI runtime.
 *
 * <p>No implementation belongs in the backend foundation. Future implementations may include
 * OllamaClient or LocalAiClient without leaking provider types into controllers or services.
 */
public interface AiClient {}
