package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.dto.RiskIntelligenceDTOs.*;
import com.techcorp.compliance.ai.service.RiskIntelligenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/risk-intelligence")
@RequiredArgsConstructor
@Slf4j
public class RiskIntelligenceController {

    private final RiskIntelligenceService riskIntelligenceService;

    // ── GET /api/v1/risk-intelligence ────────────────────────────────────────
    /**
     * Get comprehensive risk intelligence analytics
     */
    @GetMapping
    public ResponseEntity<RiskIntelligenceResponse> getRiskIntelligence() {
        log.info("GET /risk-intelligence");
        return ResponseEntity.ok(riskIntelligenceService.getRiskIntelligence());
    }

    // ── GET /api/v1/risk-intelligence/projection ─────────────────────────────
    /**
     * Get risk score projection for next 90 days
     */
    @GetMapping("/projection")
    public ResponseEntity<RiskProjection> getProjection() {
        log.info("GET /risk-intelligence/projection");
        return ResponseEntity.ok(riskIntelligenceService.getRiskProjection());
    }

    // ── GET /api/v1/risk-intelligence/alerts ─────────────────────────────────
    /**
     * Get active risk alerts
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<RiskAlert>> getAlerts() {
        log.info("GET /risk-intelligence/alerts");
        return ResponseEntity.ok(riskIntelligenceService.getRiskAlerts());
    }

    // ── GET /api/v1/risk-intelligence/critical-gaps ──────────────────────────
    /**
     * Get critical and high-risk gaps
     */
    @GetMapping("/critical-gaps")
    public ResponseEntity<List<CriticalGap>> getCriticalGaps() {
        log.info("GET /risk-intelligence/critical-gaps");
        return ResponseEntity.ok(riskIntelligenceService.getCriticalGaps());
    }

    // ── GET /api/v1/risk-intelligence/trend ──────────────────────────────────
    /**
     * Get risk trend analysis
     */
    @GetMapping("/trend")
    public ResponseEntity<RiskTrend> getTrend() {
        log.info("GET /risk-intelligence/trend");
        return ResponseEntity.ok(riskIntelligenceService.getRiskTrend());
    }
}
