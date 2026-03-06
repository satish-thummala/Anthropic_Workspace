package com.techcorp.compliance.ai.groq.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Wire DTOs for the Groq Chat Completions API.
 * Groq is OpenAI-compatible, so these match the OpenAI v1/chat/completions spec.
 *
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 * Model:    llama-3.3-70b-versatile  (free tier, no credit card required)
 * Docs:     https://console.groq.com/docs/openai
 */
public class GroqDTOs {

    // ── REQUEST ───────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChatRequest {
        private String model;
        private List<Message> messages;

        @JsonProperty("max_tokens")
        private int maxTokens;

        /** 0.0 = deterministic, 0.7 = balanced creativity */
        private double temperature;

        /** Prevent repetitive output */
        @JsonProperty("frequency_penalty")
        @Builder.Default
        private double frequencyPenalty = 0.1;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Message {
        private String role;    // "system" | "user" | "assistant"
        private String content;
    }

    // ── RESPONSE ──────────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChatResponse {
        private String id;
        private String model;
        private List<Choice> choices;
        private Usage usage;

        @JsonProperty("x_groq")
        private Object xGroq;
    }

    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {
        private int index;
        private Message message;

        @JsonProperty("finish_reason")
        private String finishReason;
    }

    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Usage {
        @JsonProperty("prompt_tokens")
        private int promptTokens;

        @JsonProperty("completion_tokens")
        private int completionTokens;

        @JsonProperty("total_tokens")
        private int totalTokens;
    }
}
