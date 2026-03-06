package com.techcorp.compliance.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

public class AiInsightsDTOs {

    // ── AI Analytics Overview Response ────────────────────────────────────────

    @Data
    @Builder
    public static class AiAnalyticsResponse {
        private ControlCategoryBreakdown categoryBreakdown;
        private GapVelocityMetrics gapVelocity;
        private ComplianceMomentum momentum;
        private TopRisks topRisks;
        private QuickWins quickWins;
    }

    // ── Control Category Breakdown ────────────────────────────────────────────

    @Data
    @Builder
    public static class ControlCategoryBreakdown {
        private List<CategoryStat> categories;
        private String weakestCategory;
        private String strongestCategory;
        private int totalCategories;
    }

    @Data
    @Builder
    public static class CategoryStat {
        private String category;
        private int total;
        private int covered;
        private int gaps;
        private int coveragePercentage;
        private String trend; // improving | declining | stable
    }

    // ── Gap Velocity Metrics ──────────────────────────────────────────────────

    @Data
    @Builder
    public static class GapVelocityMetrics {
        private int gapsOpenedLast30Days;
        private int gapsClosedLast30Days;
        private int netChange;
        private double closureRate; // percentage
        private String velocityTrend; // accelerating | decelerating | stable
        private int avgDaysToClose;
    }

    // ── Compliance Momentum ───────────────────────────────────────────────────

    @Data
    @Builder
    public static class ComplianceMomentum {
        private int score; // 0-100
        private String label; // Strong Positive | Positive | Neutral | Negative
        private String direction; // up | down | flat
        private List<MomentumFactor> factors;
    }

    @Data
    @Builder
    public static class MomentumFactor {
        private String factor;
        private int impact; // -100 to +100
        private String description;
    }

    // ── Top Risks ─────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class TopRisks {
        private List<RiskItem> risks;
        private int criticalRisks;
        private int highRisks;
    }

    @Data
    @Builder
    public static class RiskItem {
        private String framework;
        private String controlCode;
        private String title;
        private String severity;
        private int daysOpen;
        private int riskScore; // 0-100
    }

    // ── Quick Wins ────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class QuickWins {
        private List<QuickWinItem> items;
        private int totalPotentialImpact; // coverage points
    }

    @Data
    @Builder
    public static class QuickWinItem {
        private String gapId;
        private String controlCode;
        private String title;
        private String framework;
        private int impactScore; // 0-100
        private int effortScore; // 0-100 (lower is easier)
        private String reasoning;
    }

    // ── Control Coverage Heatmap ──────────────────────────────────────────────

    @Data
    @Builder
    public static class ControlCoverageHeatmap {
        private List<HeatmapRow> rows; // frameworks
        private List<String> columns; // categories
        private int maxValue;
    }

    @Data
    @Builder
    public static class HeatmapRow {
        private String framework;
        private Map<String, Integer> categoryValues; // category -> coverage %
    }

    // ── Gap Aging Distribution ────────────────────────────────────────────────

    @Data
    @Builder
    public static class GapAgingDistribution {
        private List<AgingBucket> buckets;
        private int averageDaysOpen;
        private int oldestGapDays;
        private String oldestGapId;
    }

    @Data
    @Builder
    public static class AgingBucket {
        private String label; // "0-7 days", "8-30 days", etc.
        private int count;
        private String severity; // predominant severity in bucket
    }

    // ── Compliance Velocity ───────────────────────────────────────────────────

    @Data
    @Builder
    public static class ComplianceVelocity {
        private List<VelocityDataPoint> timeline;
        private double averageVelocity; // gaps closed per week
        private String trend; // improving | declining | stable
    }

    @Data
    @Builder
    public static class VelocityDataPoint {
        private String period; // "Week 1", "Week 2", etc.
        private int opened;
        private int closed;
        private int net;
    }

    // ── Framework Correlation ─────────────────────────────────────────────────

    @Data
    @Builder
    public static class FrameworkCorrelation {
        private List<CorrelationPair> pairs;
        private String mostOverlapping;
        private int maxOverlapCount;
    }

    @Data
    @Builder
    public static class CorrelationPair {
        private String framework1;
        private String framework2;
        private int sharedControls;
        private int overlapPercentage;
    }

    // ── Predictive Insights ───────────────────────────────────────────────────

    @Data
    @Builder
    public static class PredictiveInsights {
        private ScoreProjection scoreProjection;
        private List<PredictedMilestone> milestones;
        private List<RiskAlert> alerts;
    }

    @Data
    @Builder
    public static class ScoreProjection {
        private int currentScore;
        private int projected30Days;
        private int projected60Days;
        private int projected90Days;
        private String confidence; // high | medium | low
    }

    @Data
    @Builder
    public static class PredictedMilestone {
        private String milestone; // "70% coverage", "Zero critical gaps"
        private int daysToAchieve;
        private String date; // ISO date
        private String confidence;
    }

    @Data
    @Builder
    public static class RiskAlert {
        private String type; // warning | critical
        private String message;
        private String recommendation;
        private int priority; // 1-5
    }
}
