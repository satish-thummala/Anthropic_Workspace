package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.AuthDTOs.ApiResponse;
import com.techcorp.compliance.dto.GapDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.GapService;
import com.techcorp.compliance.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gaps")
@RequiredArgsConstructor
@Slf4j
public class GapController {

    private final GapService gapService;
    private final AuditService auditService;

    // ── GET /api/v1/gaps ──────────────────────────────────────────────────────
    /**
     * Returns all gaps with optional filters (combinable):
     * ?framework=ISO27001
     * ?status=open | in_progress | resolved | accepted_risk
     * ?severity=CRITICAL | HIGH | MEDIUM | LOW
     * ?keyword=encryption
     *
     * React: GapsPage main table
     */
    @GetMapping
    public ResponseEntity<List<GapResponse>> getGaps(
            @RequestParam(required = false) String framework,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(
                gapService.getGaps(framework, status, severity, keyword));
    }

    // ── GET /api/v1/gaps/stats ────────────────────────────────────────────────
    /**
     * Returns summary counts for the 4 severity cards + per-framework breakdown.
     * React: GapsPage top stat cards
     */
    @GetMapping("/stats")
    public ResponseEntity<GapStats> getStats() {
        return ResponseEntity.ok(gapService.getStats());
    }

    // ── GET /api/v1/gaps/{id} ─────────────────────────────────────────────────
    /**
     * Single gap detail by UUID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<GapResponse> getGap(@PathVariable String id) {
        return ResponseEntity.ok(gapService.getById(id));
    }

    // ── PATCH /api/v1/gaps/{id}/status ────────────────────────────────────────
    /**
     * Moves a gap through its lifecycle workflow.
     * React: "Start" / "Resolve" buttons on each gap card
     *
     * Request body:
     * {
     * "status": "in_progress", // open | in_progress | resolved | accepted_risk
     * "remediationNotes": "optional..." // saved when resolving
     * }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<GapResponse> updateStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request) {
        log.info("PATCH /gaps/{}/status → {}", id, request.getStatus());
        GapResponse gap = gapService.getById(id);
        GapResponse updated = gapService.updateStatus(id, request);
        auditService.logChange(Action.GAP_STATUS_CHANGED, "Gap", id,
                gap.getControlCode() + " — " + gap.getControlTitle(),
                "Status changed: " + gap.getStatus() + " → " + updated.getStatus(),
                gap.getStatus(), updated.getStatus());
        return ResponseEntity.ok(updated);
    }

    // ── PATCH /api/v1/gaps/{id}/assign ────────────────────────────────────────
    /**
     * Assigns a gap to a user and optionally sets a target date.
     * Pass assignedToId: null to un-assign.
     *
     * Request body:
     * {
     * "assignedToId": 1,
     * "targetDate": "2026-06-30" // optional, ISO date
     * }
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<GapResponse> assign(
            @PathVariable String id,
            @RequestBody AssignGapRequest request) {
        log.info("PATCH /gaps/{}/assign → userId={}", id, request.getAssignedToId());
        GapResponse assigned = gapService.assign(id, request);
        auditService.log(Action.GAP_ASSIGNED, "Gap", id,
                assigned.getControlCode() + " — " + assigned.getControlTitle(),
                "Assigned to: " + (assigned.getAssignedToName() != null ? assigned.getAssignedToName() : "unassigned"));
        return ResponseEntity.ok(assigned);
    }

    // ── PATCH /api/v1/gaps/{id}/notes ─────────────────────────────────────────
    /**
     * Saves remediation notes without changing status.
     *
     * Request body:
     * { "remediationNotes": "Implemented quarterly vulnerability scanning..." }
     */
    @PatchMapping("/{id}/notes")
    public ResponseEntity<GapResponse> updateNotes(
            @PathVariable String id,
            @RequestBody UpdateNotesRequest request) {
        return ResponseEntity.ok(gapService.updateNotes(id, request));
    }

    // ── POST /api/v1/gaps/analyze ──────────────────────────────────────────────
    /**
     * Runs comprehensive gap analysis across all frameworks.
     * Scans for uncovered controls and creates new gap records.
     * 
     * React: "Run Gap Analysis" button in GapsPage header
     * 
     * Response includes:
     * - Total controls scanned
     * - New gaps created vs existing
     * - Breakdown by framework and severity
     * - List of newly identified gaps
     * - Human-readable summary message
     */
    @PostMapping("/analyze")
    public ResponseEntity<GapAnalysisResult> runAnalysis() {
        log.info("POST /gaps/analyze - Running gap analysis...");
        GapAnalysisResult result = gapService.runAnalysis();
        log.info("Gap analysis complete: {} new gaps, {} total active",
                result.getNewGapsCreated(), result.getTotalActiveGaps());
        auditService.log(Action.GAP_ANALYSIS_RUN, "System", null, "Gap Analysis",
                result.getNewGapsCreated() + " new gaps created, " + result.getTotalActiveGaps() + " total active");
        return ResponseEntity.ok(result);
    }
}
