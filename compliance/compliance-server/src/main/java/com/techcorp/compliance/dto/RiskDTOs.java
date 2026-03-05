package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class RiskDTOs {

    // ── CURRENT SCORE RESPONSE ────────────────────────────────────────────────
    /**
     * Returned by GET /api/v1/risk/score and POST /api/v1/risk/recalculate.
     * Contains everything the RiskPage needs in a single call.
     */
    @Data @Builder
    public static class RiskScoreResponse {
        private int    score;              // 0–100
        private String riskLevel;          // LOW | MEDIUM | HIGH | CRITICAL
        private String maturityLabel;      // Initial | Developing | Establishing | Established | Optimizing
        private String maturityDescription; // Human-readable explanation shown under the gauge

        // Gap factor counts (non-resolved only)
        private int criticalGaps;
        private int highGaps;
        private int mediumGaps;
        private int lowGaps;

        // Coverage totals
        private int totalControls;
        private int coveredControls;
        private int coveragePercentage;
        private int frameworksBelow70;

        // Per-framework risk breakdown (for the Risk by Framework panel)
        private List<FrameworkRiskEntry> byFramework;

        private LocalDateTime calculatedAt;
    }

    // ── PER-FRAMEWORK RISK ENTRY ──────────────────────────────────────────────
    @Data @Builder
    public static class FrameworkRiskEntry {
        private String code;
        private String name;
        private String color;
        private int    coveragePercentage;
        private int    riskScore;          // 100 - coveragePercentage
        private String riskLevel;          // LOW | MEDIUM | HIGH | CRITICAL
        private int    openGaps;
        private int    criticalGaps;
    }

    // ── HISTORY RESPONSE ──────────────────────────────────────────────────────
    /**
     * Returned by GET /api/v1/risk/history.
     * Each entry is one point on the trend chart.
     */
    @Data @Builder
    public static class RiskHistoryResponse {
        private List<RiskHistoryPoint> history;
        private int    currentScore;
        private int    firstScore;
        private int    improvement;        // currentScore - firstScore
        private String period;             // e.g. "7 months"
    }

    @Data @Builder
    public static class RiskHistoryPoint {
        private String        month;          // "Aug", "Sep" ... for chart X-axis label
        private int           score;
        private String        riskLevel;
        private String        maturityLabel;
        private LocalDateTime calculatedAt;
    }
}
