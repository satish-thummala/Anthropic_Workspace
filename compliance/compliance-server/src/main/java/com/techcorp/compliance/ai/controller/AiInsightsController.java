package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.dto.AiInsightsDTOs.*;
import com.techcorp.compliance.ai.groq.service.GroqAIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the AI Insights feature module.
 *
 * All endpoints live under /api/v1/ai/insights
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  GET  /ai/insights/status          → engine status      │
 * │  POST /ai/insights/rank            → gap priority rank  │
 * │  POST /ai/insights/explain         → gap explainer      │
 * │  POST /ai/insights/chat            → Q&A chatbot        │
 * │  GET  /ai/insights/brief           → executive brief    │
 * └─────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/v1/ai/insights")
@RequiredArgsConstructor
@Slf4j
public class AiInsightsController {

    private final GroqAIService aiService;

    @Value("${ai.groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    // ── GET /api/v1/ai/insights/status ────────────────────────────────────────
    /**
     * Returns the current AI engine status.
     * React uses this to display "Powered by Groq" or "Local Engine" badge.
     */
    @GetMapping("/status")
    public ResponseEntity<AiStatusResponse> status() {
        boolean usingGroq = aiService.isUsingGroq();
        return ResponseEntity.ok(AiStatusResponse.builder()
                .groqEnabled(usingGroq)
                .groqKeyConfigured(usingGroq)
                .activeEngine(usingGroq ? "groq" : "local")
                .model(usingGroq ? groqModel : "local-fallback")
                .message(usingGroq
                        ? "Connected to Groq — " + groqModel
                        : "Using local intelligence engine (set ai.groq.api-key to enable Groq)")
                .build());
    }

    // ── POST /api/v1/ai/insights/rank ─────────────────────────────────────────
    /**
     * Feature 1: Gap Priority Ranker
     * Ranks all open gaps by remediation priority with AI explanation.
     *
     * Body: { "topN": 10 }
     */
    @PostMapping("/rank")
    public ResponseEntity<AiResponse> rankGaps(@RequestBody(required = false) RankRequest req) {
        int topN = (req != null && req.getTopN() > 0) ? req.getTopN() : 10;
        log.info("AI Insights: rankGaps topN={}", topN);

        long start = System.currentTimeMillis();
        String result = aiService.rankGaps(topN);

        return ResponseEntity.ok(AiResponse.builder()
                .text(result)
                .feature("rank")
                .engine(aiService.isUsingGroq() ? "groq" : "local")
                .durationMs(System.currentTimeMillis() - start)
                .build());
    }

    // ── POST /api/v1/ai/insights/explain ──────────────────────────────────────
    /**
     * Feature 2: Policy Gap Explainer
     * Explains a specific gap in plain English with a remediation plan.
     *
     * Body: { "gapId": "uuid-of-the-gap" }
     */
    @PostMapping("/explain")
    public ResponseEntity<AiResponse> explainGap(@RequestBody ExplainRequest req) {
        log.info("AI Insights: explainGap gapId={}", req.getGapId());

        long start = System.currentTimeMillis();
        String result = aiService.explainGap(req.getGapId());

        return ResponseEntity.ok(AiResponse.builder()
                .text(result)
                .feature("explain")
                .engine(aiService.isUsingGroq() ? "groq" : "local")
                .durationMs(System.currentTimeMillis() - start)
                .build());
    }

    // ── POST /api/v1/ai/insights/chat ─────────────────────────────────────────
    /**
     * Feature 3: Compliance Q&A Chatbot
     * Answers natural language questions about compliance status.
     *
     * Body: { "question": "Are we compliant with GDPR?" }
     */
    @PostMapping("/chat")
    public ResponseEntity<AiResponse> chat(@RequestBody ChatRequest req) {
        log.info("AI Insights: chat question={}", req.getQuestion());

        long start = System.currentTimeMillis();
        String result = aiService.chat(req.getQuestion());

        return ResponseEntity.ok(AiResponse.builder()
                .text(result)
                .feature("chat")
                .engine(aiService.isUsingGroq() ? "groq" : "local")
                .durationMs(System.currentTimeMillis() - start)
                .build());
    }

    // ── GET /api/v1/ai/insights/brief ─────────────────────────────────────────
    /**
     * Feature 4: Executive Health Brief
     * Generates a board-ready compliance posture summary.
     */
    @GetMapping("/brief")
    public ResponseEntity<AiResponse> executiveBrief() {
        log.info("AI Insights: executiveBrief");

        long start = System.currentTimeMillis();
        String result = aiService.executiveBrief();

        return ResponseEntity.ok(AiResponse.builder()
                .text(result)
                .feature("brief")
                .engine(aiService.isUsingGroq() ? "groq" : "local")
                .durationMs(System.currentTimeMillis() - start)
                .build());
    }
}
