package com.techcorp.compliance.ai.groq.service;

import com.techcorp.compliance.ai.groq.client.GroqClient;
import com.techcorp.compliance.ai.groq.fallback.LocalFallbackEngine;
import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Central AI service for the "AI Insights" feature.
 *
 * Routes each request to:
 *  - Groq LLM (llama-3.3-70b-versatile) when ai.groq.enabled=true and key is set
 *  - LocalFallbackEngine                 when Groq is unavailable (zero cost, always works)
 *
 * All four AI Insights features are implemented here:
 *  1. rankGaps()        → Gap Priority Ranker
 *  2. explainGap()      → Policy Gap Explainer
 *  3. chat()            → Compliance Q&A Chatbot
 *  4. executiveBrief()  → Executive Health Brief
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroqAIService {

    private final GroqClient           groqClient;
    private final LocalFallbackEngine  fallback;
    private final GapRepository        gapRepo;
    private final ControlRepository    controlRepo;
    private final FrameworkRepository  frameworkRepo;
    private final RiskSnapshotRepository snapshotRepo;

    // ── 1. Gap Priority Ranker ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String rankGaps(int topN) {
        if (!groqClient.isAvailable()) {
            log.debug("Groq unavailable — using local fallback for rankGaps");
            return fallback.rankGaps(topN);
        }

        try {
            String context = buildGapContext(topN);
            String system = """
                You are a senior compliance analyst. You will receive a list of open compliance gaps.
                Rank them by remediation priority (most critical first).
                For each gap, explain WHY it is ranked at that position and give ONE concrete action.
                Be direct, specific and practical. Use a numbered list format.
                Keep total response under 600 words.
                """;
            String prompt = "Here are the current open compliance gaps. Rank them by priority and explain:\n\n" + context;
            return groqClient.chat(system, prompt, 800, 0.3);
        } catch (Exception e) {
            log.warn("Groq failed for rankGaps, falling back: {}", e.getMessage());
            return fallback.rankGaps(topN);
        }
    }

    // ── 2. Policy Gap Explainer ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String explainGap(String gapId) {
        if (!groqClient.isAvailable()) {
            log.debug("Groq unavailable — using local fallback for explainGap");
            return fallback.explainGap(gapId);
        }

        var gapOpt = gapRepo.findByIdWithDetails(gapId);
        if (gapOpt.isEmpty()) return "Gap not found: " + gapId;

        Gap g = gapOpt.get();

        try {
            String system = """
                You are a compliance expert helping a business understand and fix a specific compliance gap.
                Explain clearly: what the gap means in plain English, why it matters for the business,
                and give 3-5 concrete, actionable remediation steps with estimated effort.
                Avoid jargon. Be direct. Format with clear sections.
                """;

            String prompt = String.format("""
                Compliance Gap Details:
                Framework: %s (%s)
                Control: %s — %s
                Category: %s
                Severity: %s
                Description: %s
                Implementation Guidance: %s
                Evidence Required: %s

                Please explain this gap and provide a clear remediation plan.
                """,
                    g.getFramework().getCode(),
                    g.getFramework().getName(),
                    g.getControl().getCode(),
                    g.getControl().getTitle(),
                    g.getControl().getCategory(),
                    g.getSeverity().name(),
                    g.getDescription() != null ? g.getDescription() : "Not specified",
                    g.getControl().getImplementationGuidance() != null
                            ? g.getControl().getImplementationGuidance() : "Not specified",
                    g.getControl().getEvidenceRequired() != null
                            ? g.getControl().getEvidenceRequired().replaceAll("[\\[\\]\"\\\\]", "") : "Not specified"
            );

            return groqClient.chat(system, prompt, 900, 0.4);
        } catch (Exception e) {
            log.warn("Groq failed for explainGap, falling back: {}", e.getMessage());
            return fallback.explainGap(gapId);
        }
    }

    // ── 3. Compliance Q&A Chatbot ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String chat(String question) {
        if (!groqClient.isAvailable()) {
            log.debug("Groq unavailable — using local fallback for chat");
            return fallback.answer(question);
        }

        try {
            String context = buildChatContext();
            String system = String.format("""
                You are a compliance assistant for an organisation using a compliance management platform.
                You have access to the following live compliance data:

                %s

                Answer the user's question based on this data.
                Be concise, factual and helpful. Use plain English.
                If the question is about something not in the data, say so clearly.
                Keep responses under 300 words.
                """, context);

            return groqClient.chat(system, question, 500, 0.5);
        } catch (Exception e) {
            log.warn("Groq failed for chat, falling back: {}", e.getMessage());
            return fallback.answer(question);
        }
    }

    // ── 4. Executive Health Brief ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String executiveBrief() {
        if (!groqClient.isAvailable()) {
            log.debug("Groq unavailable — using local fallback for executiveBrief");
            return fallback.executiveBrief();
        }

        try {
            String data = buildExecutiveContext();
            String system = """
                You are a Chief Compliance Officer writing a board-level executive brief.
                Write in professional, concise business language.
                Structure: Overall Posture (2 sentences), Framework Status (bullet per framework),
                Top Risks (top 3 only), Recommended Actions (3 specific actions with owners),
                Outlook (1 sentence).
                Keep total length to 350-400 words. No jargon.
                """;
            String prompt = "Generate an executive compliance brief based on this live data:\n\n" + data;
            return groqClient.chat(system, prompt, 700, 0.4);
        } catch (Exception e) {
            log.warn("Groq failed for executiveBrief, falling back: {}", e.getMessage());
            return fallback.executiveBrief();
        }
    }

    // ── Context builders — feed live DB data to Groq ──────────────────────────

    private String buildGapContext(int topN) {
        return gapRepo.findAllActive().stream()
                .limit(topN * 2L)
                .map(g -> String.format(
                        "[%s] %s/%s — %s (Status: %s, Framework: %s)",
                        g.getSeverity().name(),
                        g.getControl().getCode(),
                        g.getControl().getTitle(),
                        g.getDescription() != null
                                ? g.getDescription().substring(0, Math.min(120, g.getDescription().length()))
                                : "No description",
                        g.getStatus().name(),
                        g.getFramework().getCode()
                ))
                .collect(Collectors.joining("\n"));
    }

    private String buildChatContext() {
        int totalCtrl   = (int) controlRepo.count();
        int coveredCtrl = (int) controlRepo.findByIsCoveredTrue().size();
        int pct         = totalCtrl == 0 ? 0 : (int) Math.round(coveredCtrl * 100.0 / totalCtrl);

        var activeGaps = gapRepo.findAllActive();
        long critical  = activeGaps.stream().filter(g -> "CRITICAL".equals(g.getSeverity().name())).count();
        long high      = activeGaps.stream().filter(g -> "HIGH".equals(g.getSeverity().name())).count();

        var scoreStr = snapshotRepo.findTopByOrderByCalculatedAtDesc()
                .map(s -> s.getScore() + "/100 (" + s.getRiskLevel() + " risk, " + s.getMaturityLabel() + " maturity)")
                .orElse("Not yet calculated");

        var frameworks = frameworkRepo.findAllActiveOrderByCode().stream()
                .map(f -> f.getCode() + ": " + f.getCoveredControls() + "/" + f.getTotalControls()
                        + " controls (" + f.getCoveragePercentage() + "%)")
                .collect(Collectors.joining(", "));

        return String.format(
                "Risk Score: %s\nOverall Coverage: %d/%d controls (%d%%)\n" +
                "Active Gaps: %d total (%d critical, %d high)\nFrameworks: %s",
                scoreStr, coveredCtrl, totalCtrl, pct,
                activeGaps.size(), critical, high, frameworks
        );
    }

    private String buildExecutiveContext() {
        return buildChatContext() + "\n\nTop critical gaps:\n" + buildGapContext(5);
    }

    /** Returns true when Groq is configured and live */
    public boolean isUsingGroq() {
        return groqClient.isAvailable();
    }
}
