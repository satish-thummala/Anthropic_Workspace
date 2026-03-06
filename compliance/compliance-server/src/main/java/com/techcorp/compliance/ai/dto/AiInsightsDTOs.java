package com.techcorp.compliance.ai.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Request and response DTOs for the AI Insights REST API.
 * All four features share this single DTO file for simplicity.
 */
public class AiInsightsDTOs {

    // ── RESPONSES ─────────────────────────────────────────────────────────────

    /**
     * Standard wrapper for every AI Insights response.
     * The frontend always gets: { text, feature, engine, durationMs }
     */
    @Data @Builder
    public static class AiResponse {
        /** The main AI-generated text content */
        private String text;

        /** Which of the 4 features generated this: rank | explain | chat | brief */
        private String feature;

        /** "groq" when Groq LLM was used, "local" when fallback was used */
        private String engine;

        /** Wall-clock time for this AI call in milliseconds */
        private long durationMs;
    }

    /**
     * Returned by GET /ai/insights/status
     * Tells the frontend which engine is active so it can show a badge.
     */
    @Data @Builder
    public static class AiStatusResponse {
        private boolean groqEnabled;
        private boolean groqKeyConfigured;
        private String  activeEngine;  // "groq" | "local"
        private String  model;         // e.g. "llama-3.3-70b-versatile" or "local-fallback"
        private String  message;
    }

    // ── REQUESTS ──────────────────────────────────────────────────────────────

    /** POST /ai/insights/rank — Gap Priority Ranker */
    @Data
    public static class RankRequest {
        /** How many top gaps to rank (default 10) */
        private int topN = 10;
    }

    /** POST /ai/insights/explain — Policy Gap Explainer */
    @Data
    public static class ExplainRequest {
        /** Gap ID to explain */
        private String gapId;
    }

    /** POST /ai/insights/chat — Compliance Q&A */
    @Data
    public static class ChatRequest {
        /** The user's question in natural language */
        private String question;
    }
}
