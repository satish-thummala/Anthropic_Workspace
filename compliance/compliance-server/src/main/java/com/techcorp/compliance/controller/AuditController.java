package com.techcorp.compliance.controller;

import com.techcorp.compliance.entity.AuditLog;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.AuditService.AuditStats;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AuditController
 *
 * Endpoints:
 *   GET /api/v1/audit             — paginated log with filters
 *   GET /api/v1/audit/stats       — summary counts
 *   GET /api/v1/audit/entity/{type}/{id} — full history of one entity
 *   GET /api/v1/audit/actions     — list of valid action types for filter dropdown
 */
@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final AuditService auditService;

    /**
     * GET /api/v1/audit
     *
     * Query params (all optional):
     *   userEmail   — filter by user
     *   action      — filter by action type (e.g. GAP_STATUS_CHANGED)
     *   entityType  — filter by entity (Gap, Document, Policy, Auth...)
     *   from        — ISO datetime e.g. 2026-01-01T00:00:00
     *   to          — ISO datetime
     *   page        — 0-based page number (default 0)
     *   size        — page size (default 50, max 100)
     */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

        log.info("GET /audit userEmail={} action={} entityType={} page={}", userEmail, action, entityType, page);
        return ResponseEntity.ok(
                auditService.getLogs(userEmail, action, entityType, from, to, page, size));
    }

    /**
     * GET /api/v1/audit/stats
     * Returns event counts for the dashboard summary cards.
     */
    @GetMapping("/stats")
    public ResponseEntity<AuditStats> getStats() {
        log.info("GET /audit/stats");
        return ResponseEntity.ok(auditService.getStats());
    }

    /**
     * GET /api/v1/audit/entity/{entityType}/{entityId}
     *
     * Returns full history for a single entity — e.g. all events for gap abc-123.
     * Used to show "History" on a gap detail view.
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        log.info("GET /audit/entity/{}/{}", entityType, entityId);
        return ResponseEntity.ok(auditService.getEntityHistory(entityType, entityId));
    }

    /**
     * GET /api/v1/audit/actions
     * Returns all valid action types for the filter dropdown in the UI.
     */
    @GetMapping("/actions")
    public ResponseEntity<List<Map<String, String>>> getActions() {
        List<Map<String, String>> actions = List.of(
            Map.of("value", "USER_LOGIN",             "label", "User Login"),
            Map.of("value", "USER_LOGOUT",            "label", "User Logout"),
            Map.of("value", "LOGIN_FAILED",           "label", "Login Failed"),
            Map.of("value", "GAP_STATUS_CHANGED",     "label", "Gap Status Changed"),
            Map.of("value", "GAP_ASSIGNED",           "label", "Gap Assigned"),
            Map.of("value", "GAP_NOTES_UPDATED",      "label", "Gap Notes Updated"),
            Map.of("value", "GAP_CREATED",            "label", "Gap Created"),
            Map.of("value", "GAP_ANALYSIS_RUN",       "label", "Gap Analysis Run"),
            Map.of("value", "DOCUMENT_UPLOADED",      "label", "Document Uploaded"),
            Map.of("value", "DOCUMENT_DELETED",       "label", "Document Deleted"),
            Map.of("value", "DOCUMENT_ANALYZED",      "label", "Document Analyzed"),
            Map.of("value", "DOCUMENT_GAP_DETECTION", "label", "Gap Detection Run"),
            Map.of("value", "POLICY_GENERATED",       "label", "Policy Generated"),
            Map.of("value", "POLICY_SAVED_TO_DOCS",   "label", "Policy Saved to Docs"),
            Map.of("value", "REPORT_GENERATED",       "label", "Report Generated"),
            Map.of("value", "RISK_RECALCULATED",      "label", "Risk Recalculated"),
            Map.of("value", "FRAMEWORK_COVERAGE_UPDATED", "label", "Framework Coverage Updated")
        );
        return ResponseEntity.ok(actions);
    }
}
