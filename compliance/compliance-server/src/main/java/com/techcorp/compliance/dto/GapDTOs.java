package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.techcorp.compliance.dto.GapDTOs.GapResponse;

public class GapDTOs {

    // ── RESPONSE ──────────────────────────────────────────────────────────────

    /**
     * Full gap record returned by GET /gaps and GET /gaps/{id}.
     * Includes denormalized control + framework fields so the frontend
     * never needs a second request.
     */
    @Data
    @Builder
    public static class GapResponse {
        private String id;

        // Control info
        private String controlId;
        private String controlCode; // e.g. "A.5.1"
        private String controlTitle;
        private String controlCategory;

        // Framework info
        private String frameworkId;
        private String frameworkCode; // e.g. "ISO27001"
        private String frameworkName;
        private String frameworkColor;

        // Gap fields
        private String gapType;
        private String severity; // CRITICAL | HIGH | MEDIUM | LOW
        private String status; // open | in_progress | resolved | accepted_risk
        private String description;
        private String aiSuggestion;
        private String remediationNotes;
        private int priority;

        // Assignment
        private Long assignedToId;
        private String assignedToName;
        private String assignedToEmail;

        // Timeline
        private LocalDateTime identifiedAt;
        private LocalDateTime assignedAt;
        private LocalDateTime startedAt;
        private LocalDateTime resolvedAt;
        private LocalDate targetDate;

        // Metadata
        private List<String> evidenceRequired;
    }

    // ── SUMMARY STATS ─────────────────────────────────────────────────────────

    /** Returned by GET /gaps/stats — powers the 4 severity counter cards. */
    @Data
    @Builder
    public static class GapStats {
        private int totalOpen;
        private int totalInProgress;
        private int totalResolved;
        private int totalAcceptedRisk;
        private int critical;
        private int high;
        private int medium;
        private int low;
        private List<FrameworkGapCount> byFramework;
    }

    @Data
    @Builder
    public static class FrameworkGapCount {
        private String frameworkCode;
        private String frameworkName;
        private String frameworkColor;
        private int total;
        private int open;
        private int critical;
    }

    // ── REQUESTS ──────────────────────────────────────────────────────────────

    /**
     * PATCH /gaps/{id}/status
     * Moves a gap through its workflow: open → in_progress → resolved.
     * Also accepts accepted_risk for explicitly waived gaps.
     */
    @Data
    public static class UpdateStatusRequest {
        private String status; // open | in_progress | resolved | accepted_risk
        private String remediationNotes; // optional — saved when resolving
    }

    /**
     * PATCH /gaps/{id}/assign
     * Assigns a gap to a user.
     */
    @Data
    public static class AssignGapRequest {
        private Long assignedToId; // users.id (BIGINT) — null to un-assign
        private String targetDate; // ISO date e.g. "2026-06-30" — optional
    }

    /**
     * PATCH /gaps/{id}/notes
     * Saves remediation notes without changing status.
     */
    @Data
    public static class UpdateNotesRequest {
        private String remediationNotes;
    }

    /**
     * Response DTO for POST /api/v1/gaps/analyze
     * Returns comprehensive analysis results including newly created gaps
     */
    @Data
    @Builder
    public static class GapAnalysisResult {
        private int totalControlsScanned; // Total uncovered controls found
        private int newGapsCreated; // New gap records created
        private int existingGaps; // Gaps that already existed
        private int totalActiveGaps; // Total active (non-resolved) gaps

        private Map<String, Long> gapsByFramework; // e.g., {"ISO27001": 5, "SOC2": 3}
        private Map<String, Long> gapsBySeverity; // e.g., {"CRITICAL": 2, "HIGH": 4}

        private long analysisTimeMs; // Time taken for analysis
        private String message; // Human-readable summary

        private List<GapResponse> newGaps; // Details of newly created gaps
    }
}
