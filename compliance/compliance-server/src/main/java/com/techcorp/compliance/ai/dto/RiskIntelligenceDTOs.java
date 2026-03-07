package com.techcorp.compliance.ai.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

public class RiskIntelligenceDTOs {

    // ── Risk Intelligence Response ────────────────────────────────────────────

    @Data
    @Builder
    public static class RiskIntelligenceResponse {
        private RiskProjection projection;
        private List<RiskAlert> alerts;
        private List<CriticalGap> criticalGaps;
        private RiskTrend trend;
    }

    // ── Risk Projection ───────────────────────────────────────────────────────

    @Data
    @Builder
    public static class RiskProjection {
        private int currentScore;
        private int projected30Days;
        private int projected60Days;
        private int projected90Days;
        private String confidence; // high | medium | low
        private String trendDirection; // improving | declining | stable
    }

    // ── Risk Alert ────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class RiskAlert {
        private String type; // critical | warning | info
        private String title;
        private String message;
        private String recommendation;
        private int priority; // 1-5
        private String severity; // CRITICAL | HIGH | MEDIUM | LOW
    }

    // ── Critical Gap ──────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class CriticalGap {
        private String gapId;
        private String controlCode;
        private String controlTitle;
        private String frameworkCode;
        private String severity;
        private int daysOpen;
        private int riskScore; // 0-100
        private String impactDescription;
    }

    // ── Risk Trend ────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class RiskTrend {
        private String direction; // improving | declining | stable
        private int changePercentage; // -100 to +100
        private String period; // last 30 days | last 60 days | last 90 days
        private List<TrendPoint> history;
    }

    @Data
    @Builder
    public static class TrendPoint {
        private String date;
        private int score;
        private int gapsOpened;
        private int gapsClosed;
    }
}
