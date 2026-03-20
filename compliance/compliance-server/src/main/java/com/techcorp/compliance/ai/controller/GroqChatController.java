package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.groq.client.GroqClient;
import com.techcorp.compliance.ai.groq.service.GroqAIService;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller that serves the frontend AI chat features.
 * Mapped to /api/v1/ai/insights/* — matching what ai-insights-api.ts calls.
 *
 * The AiInsightsController at /api/v1/ai-insights/* serves the analytics/charts.
 * This controller serves the Groq-powered Q&A, rank, explain and brief features.
 */
@RestController
@RequestMapping("/api/v1/ai/insights")
@RequiredArgsConstructor
@Slf4j
public class GroqChatController {

    private final GroqAIService  groqAIService;
    private final GroqClient     groqClient;
    private final AuditService   auditService;
    private final IncidentService incidentService;

    // ── GET /api/v1/ai/insights/status ────────────────────────────────────────
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("GET /ai/insights/status");
        boolean isGroq   = groqAIService.isUsingGroq();
        String  engine   = isGroq ? "groq" : "local";
        String  model    = isGroq ? "llama-3.3-70b-versatile" : "local-fallback";
        boolean keySet   = groqClient.isAvailable();

        return ResponseEntity.ok(Map.of(
            "groqEnabled",        keySet,
            "groqKeyConfigured",  keySet,
            "activeEngine",       engine,
            "model",              model,
            "message",            isGroq
                ? "Connected to Groq · " + model
                : "Running local fallback engine"
        ));
    }

    // ── POST /api/v1/ai/insights/rank ─────────────────────────────────────────
    @PostMapping("/rank")
    public ResponseEntity<Map<String, Object>> rankGaps(
            @RequestBody(required = false) Map<String, Object> body) {
        int topN = body != null && body.containsKey("topN")
            ? ((Number) body.get("topN")).intValue() : 10;
        log.info("POST /ai/insights/rank topN={}", topN);

        long start = System.currentTimeMillis();
        String text = groqAIService.rankGaps(topN);
        return ResponseEntity.ok(buildResponse(text, "rank",
            System.currentTimeMillis() - start));
    }

    // ── POST /api/v1/ai/insights/explain ──────────────────────────────────────
    @PostMapping("/explain")
    public ResponseEntity<Map<String, Object>> explainGap(
            @RequestBody Map<String, String> body) {
        String gapId = body.get("gapId");
        log.info("POST /ai/insights/explain gapId={}", gapId);

        long start = System.currentTimeMillis();
        String text = groqAIService.explainGap(gapId);
        return ResponseEntity.ok(buildResponse(text, "explain",
            System.currentTimeMillis() - start));
    }

    // ── POST /api/v1/ai/insights/chat ─────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, String> body) {
        String question = body.get("question");
        log.info("POST /ai/insights/chat question={}", question);

        long start = System.currentTimeMillis();
        String text = groqAIService.chat(question);
        return ResponseEntity.ok(buildResponse(text, "chat",
            System.currentTimeMillis() - start));
    }

    // ── GET /api/v1/ai/insights/brief ─────────────────────────────────────────
    @GetMapping("/brief")
    public ResponseEntity<Map<String, Object>> executiveBrief() {
        log.info("GET /ai/insights/brief");

        long start = System.currentTimeMillis();
        String text = groqAIService.executiveBrief();
        return ResponseEntity.ok(buildResponse(text, "brief",
            System.currentTimeMillis() - start));
    }

    // ── helper ────────────────────────────────────────────────────────────────
    private Map<String, Object> buildResponse(String text, String feature, long durationMs) {
        return Map.of(
            "text",       text,
            "feature",    feature,
            "engine",     groqAIService.isUsingGroq() ? "groq" : "local",
            "durationMs", durationMs
        );
    }

    // ── POST /api/v1/ai/insights/incident-report ──────────────────────────────
    /**
     * Generates a formal incident report for a specific incident.
     * Body: { "incidentId": "uuid" }
     * Also saves the AI narrative back to the incident record.
     */
    @PostMapping("/incident-report")
    public ResponseEntity<Map<String, Object>> generateIncidentReport(
            @RequestBody Map<String, String> body) {
        String incidentId = body.get("incidentId");
        log.info("POST /ai/insights/incident-report incidentId={}", incidentId);

        long start = System.currentTimeMillis();
        String text = groqAIService.generateIncidentReport(incidentId);

        // Persist the AI narrative back to the incident
        incidentService.saveAiNarrative(incidentId, text);
        auditService.log(Action.INCIDENT_REPORT_GENERATED, "Incident", incidentId,
                incidentId, "AI incident report generated");

        return ResponseEntity.ok(buildResponse(text, "incident-report",
                System.currentTimeMillis() - start));
    }

    // ── GET /api/v1/ai/insights/governance ───────────────────────────────────
    /**
     * Returns the executive governance summary — same as /brief but
     * named for the governance context and exposed as a dedicated endpoint.
     */
    @GetMapping("/governance")
    public ResponseEntity<Map<String, Object>> governanceSummary() {
        log.info("GET /ai/insights/governance");
        long start = System.currentTimeMillis();
        String text = groqAIService.executiveBrief();
        return ResponseEntity.ok(buildResponse(text, "governance",
                System.currentTimeMillis() - start));
    }
}