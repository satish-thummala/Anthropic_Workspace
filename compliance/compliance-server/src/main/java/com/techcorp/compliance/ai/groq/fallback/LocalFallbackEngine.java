package com.techcorp.compliance.ai.groq.fallback;

import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.entity.Framework;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.FrameworkRepository;
import com.techcorp.compliance.repository.GapRepository;
import com.techcorp.compliance.repository.RiskSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Local fallback engine — no external API, no cost, always available.
 *
 * Produces structured, data-driven responses for all four AI Insights features
 * when Groq is not configured (ai.groq.enabled=false or no API key).
 *
 * Output quality: deterministic, factual, and useful — not as rich as
 * Groq/LLM output but significantly better than simple static text.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LocalFallbackEngine {

    private final GapRepository         gapRepo;
    private final ControlRepository     controlRepo;
    private final FrameworkRepository   frameworkRepo;
    private final RiskSnapshotRepository snapshotRepo;

    // ── 1. Gap Priority Ranker ─────────────────────────────────────────────────

    /**
     * Returns a ranked explanation of the top N open gaps using a
     * weighted formula: severity weight × recency bonus × framework weight.
     */
    public String rankGaps(int topN) {
        var gaps = gapRepo.findAllActive();
        if (gaps.isEmpty()) return "✓ No active gaps found. All controls are currently covered.";

        // Score each gap
        Map<String, Integer> sevWeight = Map.of(
                "CRITICAL", 100, "HIGH", 60, "MEDIUM", 30, "LOW", 10);

        var ranked = gaps.stream()
                .sorted(Comparator.comparingInt(
                        (Gap g) -> -(sevWeight.getOrDefault(g.getSeverity().name(), 0))))
                .limit(topN)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("TOP ").append(ranked.size()).append(" GAPS TO REMEDIATE\n");
        sb.append("─".repeat(50)).append("\n\n");

        for (int i = 0; i < ranked.size(); i++) {
            Gap g = ranked.get(i);
            sb.append(i + 1).append(". [").append(g.getSeverity()).append("] ")
              .append(g.getControl().getCode()).append(" — ")
              .append(g.getControl().getTitle()).append("\n");
            sb.append("   Framework: ").append(g.getFramework().getCode()).append("\n");
            sb.append("   Category:  ").append(g.getControl().getCategory()).append("\n");
            sb.append("   Status:    ").append(g.getStatus().name().replace("_", " ")).append("\n");
            if (g.getAiSuggestion() != null && !g.getAiSuggestion().isBlank()) {
                String tip = g.getAiSuggestion().length() > 200
                        ? g.getAiSuggestion().substring(0, 197) + "…"
                        : g.getAiSuggestion();
                sb.append("   Action:    ").append(tip).append("\n");
            }
            sb.append("\n");
        }

        // Summary line
        long critical = gaps.stream().filter(g -> g.getSeverity().name().equals("CRITICAL")).count();
        long high     = gaps.stream().filter(g -> g.getSeverity().name().equals("HIGH")).count();
        sb.append("SUMMARY: ").append(gaps.size()).append(" total active gaps — ")
          .append(critical).append(" critical, ").append(high).append(" high priority.");

        return sb.toString();
    }

    // ── 2. Gap Explainer ───────────────────────────────────────────────────────

    /**
     * Produces a plain-English explanation of a single gap with
     * a structured remediation checklist.
     */
    public String explainGap(String gapId) {
        var gapOpt = gapRepo.findByIdWithDetails(gapId);
        if (gapOpt.isEmpty()) return "Gap not found: " + gapId;

        Gap g = gapOpt.get();
        var ctrl = g.getControl();

        StringBuilder sb = new StringBuilder();
        sb.append("GAP EXPLANATION\n");
        sb.append("═".repeat(50)).append("\n\n");

        sb.append("Control:     ").append(ctrl.getCode()).append(" — ").append(ctrl.getTitle()).append("\n");
        sb.append("Framework:   ").append(g.getFramework().getCode())
          .append(" (").append(g.getFramework().getName()).append(")\n");
        sb.append("Severity:    ").append(g.getSeverity().name()).append("\n");
        sb.append("Category:    ").append(ctrl.getCategory()).append("\n\n");

        sb.append("WHAT THIS MEANS\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append(g.getDescription() != null ? g.getDescription()
                : "This control is not currently evidenced in your uploaded documents.").append("\n\n");

        sb.append("WHY IT MATTERS\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append(buildWhyItMatters(g)).append("\n\n");

        sb.append("REMEDIATION STEPS\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append(g.getAiSuggestion() != null ? g.getAiSuggestion()
                : "Review and implement the control requirements.").append("\n\n");

        if (ctrl.getEvidenceRequired() != null && !ctrl.getEvidenceRequired().isBlank()) {
            sb.append("EVIDENCE REQUIRED\n");
            sb.append("─".repeat(30)).append("\n");
            sb.append(ctrl.getEvidenceRequired().replaceAll("[\\[\\]\"\\\\]", "").trim()).append("\n");
        }

        return sb.toString();
    }

    // ── 3. Compliance Q&A ──────────────────────────────────────────────────────

    /**
     * Rule-based Q&A: detects intent from the question and returns
     * a data-backed answer from the database.
     */
    public String answer(String question) {
        String q = question.toLowerCase();

        if (containsAny(q, "risk", "score", "maturity")) return buildRiskAnswer();
        if (containsAny(q, "critical", "urgent", "worst")) return buildCriticalGapsAnswer();
        if (containsAny(q, "framework", "iso", "soc", "gdpr", "hipaa")) return buildFrameworkAnswer(q);
        if (containsAny(q, "coverage", "covered", "percent")) return buildCoverageAnswer();
        if (containsAny(q, "gap", "missing", "open")) return buildGapSummaryAnswer();
        if (containsAny(q, "evidence", "proof", "document")) return buildEvidenceAnswer();
        if (containsAny(q, "progress", "trend", "improve")) return buildProgressAnswer();

        return buildGeneralAnswer();
    }

    // ── 4. Executive Health Brief ──────────────────────────────────────────────

    /**
     * Generates a board-ready compliance health brief from live database data.
     */
    public String executiveBrief() {
        var frameworks  = frameworkRepo.findAllActiveOrderByCode();
        var activeGaps  = gapRepo.findAllActive();
        var snapOpt     = snapshotRepo.findTopByOrderByCalculatedAtDesc();

        int totalCtrl   = (int) controlRepo.count();
        int coveredCtrl = (int) controlRepo.findByIsCoveredTrue().size();
        int pct         = totalCtrl == 0 ? 0 : (int) Math.round(coveredCtrl * 100.0 / totalCtrl);

        long critical   = activeGaps.stream().filter(g -> "CRITICAL".equals(g.getSeverity().name())).count();
        long high       = activeGaps.stream().filter(g -> "HIGH".equals(g.getSeverity().name())).count();
        long medium     = activeGaps.stream().filter(g -> "MEDIUM".equals(g.getSeverity().name())).count();

        int score = snapOpt.map(s -> s.getScore()).orElse(pct);
        String maturity = maturityLabel(score);
        String riskLevel = score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : score >= 40 ? "HIGH" : "CRITICAL";

        StringBuilder sb = new StringBuilder();
        sb.append("COMPLIANCE EXECUTIVE BRIEF\n");
        sb.append("Generated: ").append(java.time.LocalDate.now()).append("\n");
        sb.append("═".repeat(50)).append("\n\n");

        sb.append("OVERALL POSTURE\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append("Risk Score:     ").append(score).append("/100\n");
        sb.append("Risk Level:     ").append(riskLevel).append("\n");
        sb.append("Maturity:       ").append(maturity).append("\n");
        sb.append("Coverage:       ").append(coveredCtrl).append(" of ").append(totalCtrl)
          .append(" controls (").append(pct).append("%)\n\n");

        sb.append("FRAMEWORK STATUS\n");
        sb.append("─".repeat(30)).append("\n");
        for (Framework fw : frameworks) {
            String bar = progressBar(fw.getCoveragePercentage());
            sb.append(String.format("%-10s %s %d%%\n",
                    fw.getCode(), bar, fw.getCoveragePercentage()));
        }
        sb.append("\n");

        sb.append("OPEN GAPS SUMMARY\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append("Critical: ").append(critical).append("  |  ");
        sb.append("High: ").append(high).append("  |  ");
        sb.append("Medium: ").append(medium).append("\n");
        sb.append("Total active gaps: ").append(activeGaps.size()).append("\n\n");

        sb.append("BOARD RECOMMENDATION\n");
        sb.append("─".repeat(30)).append("\n");
        sb.append(buildBoardRecommendation(riskLevel, critical, high, pct)).append("\n\n");

        sb.append("TOP 3 PRIORITY ACTIONS\n");
        sb.append("─".repeat(30)).append("\n");
        activeGaps.stream()
                .filter(g -> "CRITICAL".equals(g.getSeverity().name()))
                .limit(3)
                .forEach(g -> sb.append("• [").append(g.getFramework().getCode()).append("] ")
                        .append(g.getControl().getCode()).append(": ")
                        .append(g.getControl().getTitle()).append("\n"));
        if (critical == 0) sb.append("• No critical gaps — focus on HIGH severity items.\n");

        return sb.toString();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String buildWhyItMatters(Gap g) {
        return switch (g.getSeverity().name()) {
            case "CRITICAL" -> "This is a critical control. Non-compliance may result in audit failure, " +
                    "regulatory fines, or security incidents. Immediate action is required.";
            case "HIGH" -> "This high-priority control gap exposes the organisation to significant risk. " +
                    "It should be addressed within the current planning cycle.";
            case "MEDIUM" -> "This gap represents a moderate compliance risk. " +
                    "Include in the next remediation sprint.";
            default -> "This is a low-priority gap. Address during routine compliance maintenance.";
        };
    }

    private String buildRiskAnswer() {
        return snapshotRepo.findTopByOrderByCalculatedAtDesc()
                .map(s -> "Your current compliance risk score is " + s.getScore() + "/100 — " +
                        s.getRiskLevel() + " risk, " + s.getMaturityLabel() + " maturity level.\n\n" +
                        "Key factors: " + s.getCriticalGaps() + " critical gaps (−" +
                        s.getCriticalGaps() * 8 + " pts), " + s.getHighGaps() +
                        " high gaps (−" + s.getHighGaps() * 4 + " pts).\n\n" +
                        "To improve: resolve critical gaps first — each one adds 8 points back to your score.")
                .orElse("No risk snapshot found. Click 'Recalculate' on the Risk page to generate a score.");
    }

    private String buildCriticalGapsAnswer() {
        var critical = gapRepo.findAllActive().stream()
                .filter(g -> "CRITICAL".equals(g.getSeverity().name()))
                .limit(5).toList();
        if (critical.isEmpty()) return "✓ No critical gaps currently open. Great compliance posture!";

        StringBuilder sb = new StringBuilder("You have " + critical.size() + " critical open gap(s):\n\n");
        critical.forEach(g -> sb.append("• ").append(g.getFramework().getCode())
                .append(" ").append(g.getControl().getCode())
                .append(" — ").append(g.getControl().getTitle()).append("\n"));
        sb.append("\nThese should be resolved immediately as they carry the highest audit risk.");
        return sb.toString();
    }

    private String buildFrameworkAnswer(String q) {
        var frameworks = frameworkRepo.findAllActiveOrderByCode();
        StringBuilder sb = new StringBuilder("FRAMEWORK COVERAGE SUMMARY\n\n");
        for (Framework fw : frameworks) {
            if (q.contains("all") || q.contains(fw.getCode().toLowerCase())) {
                sb.append(fw.getCode()).append(" — ").append(fw.getName()).append("\n");
                sb.append("  Coverage: ").append(fw.getCoveredControls())
                  .append("/").append(fw.getTotalControls())
                  .append(" controls (").append(fw.getCoveragePercentage()).append("%)\n\n");
            }
        }
        return sb.toString();
    }

    private String buildCoverageAnswer() {
        int total   = (int) controlRepo.count();
        int covered = (int) controlRepo.findByIsCoveredTrue().size();
        int pct     = total == 0 ? 0 : (int) Math.round(covered * 100.0 / total);
        return "Overall compliance coverage: " + covered + " of " + total + " controls (" + pct + "%).\n\n" +
                "To improve coverage, upload relevant policy documents and run 'Map All Documents' " +
                "on the Frameworks page.";
    }

    private String buildGapSummaryAnswer() {
        var all      = gapRepo.findAllActive();
        long open    = all.stream().filter(g -> g.getStatus().name().equals("open")).count();
        long inProg  = all.stream().filter(g -> g.getStatus().name().equals("in_progress")).count();
        return "You have " + all.size() + " active gaps: " + open + " open, " + inProg +
                " in progress.\n\nVisit the Gap Analysis page to review each gap, assign owners, and track remediation.";
    }

    private String buildEvidenceAnswer() {
        long noEvidence = gapRepo.findAllActive().stream()
                .filter(g -> g.getEvidenceRequired() == null || g.getEvidenceRequired().isBlank())
                .count();
        return "Evidence is required to prove controls are implemented. " +
                "Upload your policy documents, audit logs, and SOPs via the Documents page, " +
                "then run 'Map All Documents' to automatically map them to controls.\n\n" +
                "Currently " + noEvidence + " gaps have unspecified evidence requirements.";
    }

    private String buildProgressAnswer() {
        var snaps = snapshotRepo.findAllForTrend();
        if (snaps.size() < 2) return "Not enough history yet. Risk scores are tracked each time you recalculate.";
        int first   = snaps.get(0).getScore();
        int current = snaps.get(snaps.size() - 1).getScore();
        int delta   = current - first;
        return "Over " + snaps.size() + " recorded snapshots, your risk score moved from " +
                first + " to " + current + " (" + (delta >= 0 ? "+" : "") + delta + " points).\n\n" +
                (delta > 0 ? "Good progress! Keep resolving high and critical gaps to continue improving."
                           : "Score has declined. Focus on resolving critical gaps to reverse the trend.");
    }

    private String buildGeneralAnswer() {
        int total   = (int) controlRepo.count();
        int covered = (int) controlRepo.findByIsCoveredTrue().size();
        long active = gapRepo.count();
        return "Here's a quick compliance snapshot:\n\n" +
                "• Controls covered: " + covered + "/" + total + "\n" +
                "• Active gaps: " + active + "\n\n" +
                "Try asking about: risk score, critical gaps, framework coverage, " +
                "evidence requirements, or compliance progress.";
    }

    private String buildBoardRecommendation(String risk, long critical, long high, int pct) {
        if ("CRITICAL".equals(risk) || "HIGH".equals(risk)) {
            return "IMMEDIATE ACTION REQUIRED. The organisation has " + critical +
                    " critical and " + high + " high-severity compliance gaps. " +
                    "A dedicated remediation programme should be initiated with executive sponsorship.";
        }
        if (pct >= 80) {
            return "Compliance posture is strong at " + pct + "% coverage. " +
                    "Maintain current controls and schedule next audit cycle review.";
        }
        return "Coverage is at " + pct + "%. Continue systematic remediation of open gaps " +
                "with focus on critical items. Monthly review recommended.";
    }

    private String maturityLabel(int score) {
        if (score >= 90) return "Optimizing";
        if (score >= 75) return "Established";
        if (score >= 55) return "Establishing";
        if (score >= 35) return "Developing";
        return "Initial";
    }

    private String progressBar(int pct) {
        int filled = pct / 10;
        return "█".repeat(filled) + "░".repeat(10 - filled);
    }

    private boolean containsAny(String text, String... terms) {
        for (String t : terms) if (text.contains(t)) return true;
        return false;
    }
}
