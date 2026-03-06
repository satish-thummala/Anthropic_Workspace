package com.techcorp.compliance.ai.groq.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techcorp.compliance.ai.groq.dto.GroqDTOs.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * Low-level HTTP client for the Groq Chat Completions API.
 *
 * Uses Java 11+ HttpClient (no extra dependencies).
 * All AI features in this package call this client — it is the only
 * class that knows the Groq endpoint URL and API key.
 *
 * Configuration (application.properties):
 *   ai.groq.api-key=gsk_xxxxxxxxxxxxxxxxxxxx   ← get free at console.groq.com
 *   ai.groq.model=llama-3.3-70b-versatile       ← free, fast, high quality
 *   ai.groq.enabled=true                        ← false = use local fallback
 */
@Component
@Slf4j
public class GroqClient {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Value("${ai.groq.api-key:}")
    private String apiKey;

    @Value("${ai.groq.model:llama-3.3-70b-versatile}")
    private String model;

    @Value("${ai.groq.enabled:false}")
    private boolean enabled;

    private final HttpClient httpClient;
    private final ObjectMapper mapper;

    public GroqClient(ObjectMapper mapper) {
        this.mapper = mapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Returns true if Groq is configured and should be used.
     * Falls back to local engine when false.
     */
    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    /**
     * Calls Groq with a system prompt + user message.
     * Returns the assistant's reply text, or throws on error.
     *
     * @param systemPrompt  Context/instructions for the model
     * @param userMessage   The actual question/task
     * @param maxTokens     Response length limit (keep under 1024 for free tier speed)
     * @param temperature   0.0 = factual, 0.7 = creative
     */
    public String chat(String systemPrompt, String userMessage,
                       int maxTokens, double temperature) throws Exception {

        ChatRequest request = ChatRequest.builder()
                .model(model)
                .messages(List.of(
                        Message.builder().role("system").content(systemPrompt).build(),
                        Message.builder().role("user").content(userMessage).build()
                ))
                .maxTokens(maxTokens)
                .temperature(temperature)
                .build();

        String body = mapper.writeValueAsString(request);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();

        log.debug("Groq request → model={} maxTokens={}", model, maxTokens);

        HttpResponse<String> response = httpClient.send(
                httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Groq API error: status={} body={}", response.statusCode(), response.body());
            throw new RuntimeException("Groq API error " + response.statusCode() + ": " + response.body());
        }

        ChatResponse chatResponse = mapper.readValue(response.body(), ChatResponse.class);

        if (chatResponse.getChoices() == null || chatResponse.getChoices().isEmpty()) {
            throw new RuntimeException("Groq returned empty choices");
        }

        String reply = chatResponse.getChoices().get(0).getMessage().getContent();
        log.debug("Groq reply: {} tokens used", chatResponse.getUsage().getTotalTokens());
        return reply;
    }
}
