package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.RiskDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.RiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/risk")
@RequiredArgsConstructor
@Slf4j
public class RiskController {

    private final RiskService  riskService;
    private final AuditService auditService;


    // ── GET /api/v1/risk/score ────────────────────────────────────────────────
    /**
     * Returns the most recently calculated risk score.
     * If no snapshot exists yet (fresh install), computes one live.
     *
     * React: RiskPage gauge, risk factors panel, framework breakdown.
     *        Also used by DashboardPage score display.
     */
    @GetMapping("/score")
    public ResponseEntity<RiskScoreResponse> getScore() {
        return ResponseEntity.ok(riskService.getCurrentScore());
    }

    // ── POST /api/v1/risk/recalculate ─────────────────────────────────────────
    /**
     * Computes a fresh risk score from current DB state, persists a new
     * risk_snapshots row, and returns the result immediately.
     *
     * React: "Recalculate" button on RiskPage header.
     */
    @PostMapping("/recalculate")
    public ResponseEntity<RiskScoreResponse> recalculate() {
        log.info("POST /risk/recalculate");
        return ResponseEntity.ok(riskService.recalculate());
    }

    // ── GET /api/v1/risk/history ──────────────────────────────────────────────
    /**
     * Returns all historical snapshots ordered oldest → newest.
     * Each point has: month label, score, riskLevel, maturityLabel.
     *
     * React: LineChart in RiskPage trend panel.
     *        DashboardPage mini trend chart also uses the last 7 points.
     */
    @GetMapping("/history")
    public ResponseEntity<RiskHistoryResponse> getHistory() {
        return ResponseEntity.ok(riskService.getHistory());
    }
}
