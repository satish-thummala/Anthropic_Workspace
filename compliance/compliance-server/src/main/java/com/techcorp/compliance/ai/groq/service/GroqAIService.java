package com.techcorp.compliance.ai.groq.service;

import com.techcorp.compliance.ai.groq.client.GroqClient;
import com.techcorp.compliance.ai.groq.fallback.LocalFallbackEngine;
import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.repository.*;
import com.techcorp.compliance.service.IncidentService;
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
    private final IncidentService         incidentService;

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


    // ── 5. Incident Report Generator ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public String generateIncidentReport(String incidentId) {
        var incident = incidentService.getById(incidentId);

        if (!groqClient.isAvailable()) {
            return buildFallbackIncidentReport(incident);
        }

        try {
            String system = """
                You are a senior information security officer writing a formal incident report.
                Write in professional, precise language suitable for board review and regulatory submission.
                Structure the report clearly with all required sections.
                Be specific about timelines, impacts, and actions. Do not use vague language.
                Format as Markdown with ## section headings.
                """;

            String prompt = String.format("""
                Generate a formal incident report for the following security incident:

                Title: %s
                Type: %s
                Severity: %s
                Status: %s
                Affected Systems: %s
                Affected Frameworks: %s
                Personal Data Involved: %s
                Records Affected: %s
                Detected: %s
                Description: %s
                Root Cause: %s
                Corrective Actions: %s
                Lessons Learned: %s

                Write a complete formal incident report with these sections:
                1. Executive Summary
                2. Incident Timeline
                3. Impact Assessment (systems, data, regulatory)
                4. Root Cause Analysis
                5. Containment and Remediation Actions
                6. Regulatory Notification Requirements (%s)
                7. Lessons Learned and Preventive Measures
                8. Sign-off and Review

                Make it audit-ready and specific to this incident.
                """,
                    incident.getTitle(),
                    incident.getIncidentType(),
                    incident.getSeverity(),
                    incident.getStatus(),
                    incident.getAffectedSystems() != null ? incident.getAffectedSystems() : "Not specified",
                    incident.getAffectedFrameworks() != null ? incident.getAffectedFrameworks() : "Not specified",
                    incident.isPersonalDataInvolved() ? "YES — regulatory notification may be required" : "No",
                    incident.getRecordsAffected() != null ? incident.getRecordsAffected() : "Unknown",
                    incident.getDetectedAt() != null ? incident.getDetectedAt().toString() : "Unknown",
                    incident.getDescription() != null ? incident.getDescription() : "Not provided",
                    incident.getRootCause() != null ? incident.getRootCause() : "Under investigation",
                    incident.getCorrectiveActions() != null ? incident.getCorrectiveActions() : "In progress",
                    incident.getLessonsLearned() != null ? incident.getLessonsLearned() : "Pending review",
                    incident.isPersonalDataInvolved()
                            ? "Personal data involved — GDPR Art.33 (72hr authority notification), HIPAA Breach Notification Rule"
                            : "No personal data involved"
            );

            return groqClient.chat(system, prompt, 2000, 0.3);
        } catch (Exception e) {
            log.warn("Groq failed for incident report, falling back: {}", e.getMessage());
            return buildFallbackIncidentReport(incident);
        }
    }

    private String buildFallbackIncidentReport(com.techcorp.compliance.dto.IncidentDTOs.IncidentResponse i) {
        String date = java.time.LocalDate.now().toString();
        return String.format("""
            # Incident Report

            | Field | Value |
            |---|---|
            | **Incident ID** | %s |
            | **Title** | %s |
            | **Type** | %s |
            | **Severity** | %s |
            | **Status** | %s |
            | **Report Date** | %s |

            ---

            ## 1. Executive Summary

            A **%s** severity incident of type **%s** was detected on %s.
            Current status: **%s**.%s

            ## 2. Incident Timeline

            | Milestone | Timestamp |
            |---|---|
            | Detected | %s |
            | Contained | %s |
            | Resolved | %s |
            | Closed | %s |

            ## 3. Impact Assessment

            **Affected Systems:** %s

            **Affected Frameworks:** %s

            **Personal Data Involved:** %s%s

            ## 4. Root Cause Analysis

            %s

            ## 5. Containment and Remediation Actions

            %s

            ## 6. Regulatory Notification Requirements

            %s

            ## 7. Lessons Learned

            %s

            ## 8. Sign-off

            | Role | Name | Date |
            |---|---|---|
            | Incident Owner | %s | %s |
            | CISO | | |
            | DPO | | |

            ---
            *This report was generated by ComplianceAI Platform. Review and sign before submission.*
            """,
                i.getId(), i.getTitle(),
                i.getIncidentType() != null ? i.getIncidentType().replace("_", " ") : "—",
                i.getSeverity(), i.getStatus(), date,
                i.getSeverity(),
                i.getIncidentType() != null ? i.getIncidentType().replace("_", " ") : "unknown type",
                i.getDetectedAt() != null ? i.getDetectedAt().toLocalDate() : "unknown date",
                i.getStatus(),
                i.getDescription() != null ? " " + i.getDescription() : "",
                i.getDetectedAt() != null  ? i.getDetectedAt().toString()  : "—",
                i.getContainedAt() != null ? i.getContainedAt().toString() : "—",
                i.getResolvedAt()  != null ? i.getResolvedAt().toString()  : "—",
                i.getClosedAt()    != null ? i.getClosedAt().toString()    : "—",
                i.getAffectedSystems()   != null ? i.getAffectedSystems()   : "Not specified",
                i.getAffectedFrameworks() != null ? i.getAffectedFrameworks() : "Not specified",
                i.isPersonalDataInvolved() ? "**YES**" : "No",
                i.isPersonalDataInvolved()
                    ? "\n\n> **Records affected:** " + (i.getRecordsAffected() != null ? i.getRecordsAffected() : "Unknown")
                    : "",
                i.getRootCause()         != null ? i.getRootCause()         : "*Root cause analysis pending.*",
                i.getCorrectiveActions() != null ? i.getCorrectiveActions() : "*Corrective actions in progress.*",
                i.isPersonalDataInvolved()
                    ? "Personal data was involved in this incident. Regulatory notification obligations:\n\n"
                    + "- **GDPR Article 33:** Notify supervisory authority within 72 hours of becoming aware\n"
                    + "- **GDPR Article 34:** Notify affected individuals if high risk to their rights\n"
                    + "- **HIPAA Breach Notification Rule:** Notify HHS and affected individuals\n\n"
                    + "**Regulator notified:** " + (i.isRegulatorNotified() ? "Yes" : "**PENDING**")
                    : "No personal data was involved in this incident. No mandatory regulatory notification required.",
                i.getLessonsLearned()    != null ? i.getLessonsLearned()    : "*Post-incident review pending.*",
                i.getAssignedToName()    != null ? i.getAssignedToName()    : "—",
                date
        );
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
