package com.techcorp.compliance.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for the Policy Generator feature.
 *
 * Endpoint: POST /api/v1/ai/policy/generate
 */
public class PolicyDTOs {

    // ── Request ───────────────────────────────────────────────────────────────

    @Data
    public static class PolicyGenerateRequest {

        /**
         * Policy type key — must match one of the five supported types:
         *   access_control | incident_response | data_protection |
         *   acceptable_use | business_continuity
         */
        private String type;

        /**
         * Framework code to align the policy with: ISO27001 | SOC2 | GDPR | HIPAA
         * Optional — if blank, policy is framework-agnostic.
         */
        private String frameworkCode;

        /**
         * Organisation name to embed in the policy header and ownership clauses.
         * Optional — defaults to "Your Organisation" if blank.
         */
        private String orgName;
    }

    // ── Response ──────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class PolicyGenerateResponse {

        /** Human-readable title, e.g. "Access Control Policy — ISO 27001" */
        private String title;

        /**
         * Full policy text in Markdown format.
         * Sections: Purpose, Scope, Policy Statement, Controls/Requirements,
         * Roles & Responsibilities, Compliance & Review, References.
         */
        private String content;

        /** Policy type key echoed back */
        private String policyType;

        /** Human-readable policy type label */
        private String policyTypeLabel;

        /** Framework code used, or "General" if none */
        private String framework;

        /** Organisation name embedded in the policy */
        private String orgName;

        /** "groq" or "local" — which engine produced the content */
        private String engine;

        /** Generation time in milliseconds */
        private long durationMs;

        private LocalDateTime generatedAt;
    }

    // ── Save to Documents request ─────────────────────────────────────────────

    /**
     * Request body for POST /api/v1/ai/policy/save
     * Contains the full generated policy to persist as a Document record.
     */
    @Data
    public static class PolicySaveRequest {
        private String title;
        private String content;
        private String policyType;
        private String policyTypeLabel;
        private String framework;
        private String orgName;
        private String engine;
        /** Optional — who triggered the save. Shown in Documents as uploadedByName. */
        private String savedByName;
    }

    // ── Policy type metadata (returned by GET /types) ─────────────────────────

    @Data
    @Builder
    public static class PolicyTypeInfo {
        private String id;
        private String label;
        private String description;
        private List<String> compatibleFrameworks;
    }
}
