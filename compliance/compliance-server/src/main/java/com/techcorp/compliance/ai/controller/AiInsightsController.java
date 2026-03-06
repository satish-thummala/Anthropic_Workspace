package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.dto.AiInsightsDTOs.*;
import com.techcorp.compliance.ai.service.AiInsightsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai-insights")
@RequiredArgsConstructor
@Slf4j
public class AiInsightsController {

    private final AiInsightsService aiInsightsService;

    // ── GET /api/v1/ai-insights/analytics ────────────────────────────────────
    /**
     * Get comprehensive AI analytics for Overview tab
     * Returns unique insights not available elsewhere
     */
    @GetMapping("/analytics")
    public ResponseEntity<AiAnalyticsResponse> getAnalytics() {
        log.info("GET /ai-insights/analytics");
        return ResponseEntity.ok(aiInsightsService.getAnalytics());
    }

    // ── GET /api/v1/ai-insights/control-coverage-heatmap ──────────────────────
    /**
     * Get control category coverage heatmap across frameworks
     */
    @GetMapping("/control-coverage-heatmap")
    public ResponseEntity<ControlCoverageHeatmap> getControlCoverageHeatmap() {
        log.info("GET /ai-insights/control-coverage-heatmap");
        return ResponseEntity.ok(aiInsightsService.getControlCoverageHeatmap());
    }

    // ── GET /api/v1/ai-insights/gap-aging-distribution ────────────────────────
    /**
     * Get gap aging distribution (how long gaps have been open)
     */
    @GetMapping("/gap-aging-distribution")
    public ResponseEntity<GapAgingDistribution> getGapAgingDistribution() {
        log.info("GET /ai-insights/gap-aging-distribution");
        return ResponseEntity.ok(aiInsightsService.getGapAgingDistribution());
    }

    // ── GET /api/v1/ai-insights/compliance-velocity ───────────────────────────
    /**
     * Get compliance velocity metrics (gaps opened vs closed over time)
     */
    @GetMapping("/compliance-velocity")
    public ResponseEntity<ComplianceVelocity> getComplianceVelocity() {
        log.info("GET /ai-insights/compliance-velocity");
        return ResponseEntity.ok(aiInsightsService.getComplianceVelocity());
    }

    // ── GET /api/v1/ai-insights/framework-correlation ─────────────────────────
    /**
     * Get framework overlap analysis (shared controls)
     */
    @GetMapping("/framework-correlation")
    public ResponseEntity<FrameworkCorrelation> getFrameworkCorrelation() {
        log.info("GET /ai-insights/framework-correlation");
        return ResponseEntity.ok(aiInsightsService.getFrameworkCorrelation());
    }

    // ── GET /api/v1/ai-insights/predictive-insights ───────────────────────────
    /**
     * Get predictive insights (trend projections, risk forecast)
     */
    @GetMapping("/predictive-insights")
    public ResponseEntity<PredictiveInsights> getPredictiveInsights() {
        log.info("GET /ai-insights/predictive-insights");
        return ResponseEntity.ok(aiInsightsService.getPredictiveInsights());
    }
}
