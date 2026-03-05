package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.RiskDTOs.*;
import com.techcorp.compliance.entity.Control.Severity;
import com.techcorp.compliance.entity.Gap.GapStatus;
import com.techcorp.compliance.entity.RiskSnapshot;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.FrameworkRepository;
import com.techcorp.compliance.repository.GapRepository;
import com.techcorp.compliance.repository.RiskSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskService {

    private final RiskSnapshotRepository snapshotRepo;
    private final FrameworkRepository    frameworkRepo;
    private final ControlRepository      controlRepo;
    private final GapRepository          gapRepo;

    // ── Scoring weights ───────────────────────────────────────────────────────
    // Penalties are subtracted from the base coverage percentage.
    // Kept conservative so the score reflects real-world improvement.
    private static final int PENALTY_CRITICAL = 8;   // per open critical gap
    private static final int PENALTY_HIGH     = 4;   // per open high gap
    private static final int PENALTY_MEDIUM   = 2;   // per open medium gap
    private static final int TARGET_SCORE     = 85;

    // ── Month label formatter ─────────────────────────────────────────────────
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMM");

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/risk/score  — current score (reads latest snapshot)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RiskScoreResponse getCurrentScore() {
        return snapshotRepo.findTopByOrderByCalculatedAtDesc()
                .map(this::snapshotToScoreResponse)
                .orElseGet(this::computeLiveScore);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/v1/risk/recalculate  — compute fresh score, persist snapshot
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public RiskScoreResponse recalculate() {
        log.info("Risk recalculation triggered");

        // 1. Gather raw inputs
        var frameworks   = frameworkRepo.findAllActiveOrderByCode();
        int totalCtrl    = (int) controlRepo.count();
        int coveredCtrl  = (int) controlRepo.findByIsCoveredTrue().size();
        int basePct      = totalCtrl == 0 ? 0 : (int) Math.round(coveredCtrl * 100.0 / totalCtrl);

        int critGaps     = (int) gapRepo.countBySeverityAndStatusNot(Severity.CRITICAL, GapStatus.resolved);
        int highGaps     = (int) gapRepo.countBySeverityAndStatusNot(Severity.HIGH,     GapStatus.resolved);
        int medGaps      = (int) gapRepo.countBySeverityAndStatusNot(Severity.MEDIUM,   GapStatus.resolved);
        int lowGaps      = (int) gapRepo.countBySeverityAndStatusNot(Severity.LOW,      GapStatus.resolved);

        int fwBelow70    = (int) frameworks.stream()
                .filter(f -> f.getCoveragePercentage() < 70).count();

        // 2. Apply scoring formula
        int penalty = (critGaps * PENALTY_CRITICAL)
                    + (highGaps  * PENALTY_HIGH)
                    + (medGaps   * PENALTY_MEDIUM);
        int score   = Math.max(0, Math.min(100, basePct - penalty));

        String riskLevel    = riskLevel(score);
        String maturityLabel = maturityLabel(score);

        // 3. Persist snapshot
        RiskSnapshot snap = RiskSnapshot.builder()
                .score(score)
                .riskLevel(riskLevel)
                .maturityLabel(maturityLabel)
                .criticalGaps(critGaps)
                .highGaps(highGaps)
                .mediumGaps(medGaps)
                .lowGaps(lowGaps)
                .totalControls(totalCtrl)
                .coveredControls(coveredCtrl)
                .coveragePercentage(basePct)
                .frameworksBelow70(fwBelow70)
                .calculatedAt(LocalDateTime.now())
                .build();
        snapshotRepo.save(snap);
        log.info("Risk snapshot saved: score={} riskLevel={}", score, riskLevel);

        // 4. Build per-framework breakdown
        List<FrameworkRiskEntry> byFramework = frameworks.stream()
                .map(fw -> {
                    int fwCrit = (int) gapRepo.countBySeverityAndStatusNot(Severity.CRITICAL, GapStatus.resolved);
                    int rs     = 100 - fw.getCoveragePercentage();
                    return FrameworkRiskEntry.builder()
                            .code(fw.getCode())
                            .name(fw.getName())
                            .color(fw.getColor())
                            .coveragePercentage(fw.getCoveragePercentage())
                            .riskScore(rs)
                            .riskLevel(riskLevelFromRiskScore(rs))
                            .openGaps(0)          // framework-level gap count not needed for UI
                            .criticalGaps(0)
                            .build();
                })
                .collect(Collectors.toList());

        return RiskScoreResponse.builder()
                .score(score)
                .riskLevel(riskLevel)
                .maturityLabel(maturityLabel)
                .maturityDescription(maturityDescription(score))
                .criticalGaps(critGaps)
                .highGaps(highGaps)
                .mediumGaps(medGaps)
                .lowGaps(lowGaps)
                .totalControls(totalCtrl)
                .coveredControls(coveredCtrl)
                .coveragePercentage(basePct)
                .frameworksBelow70(fwBelow70)
                .byFramework(byFramework)
                .calculatedAt(snap.getCalculatedAt())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/v1/risk/history — all snapshots for trend chart
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RiskHistoryResponse getHistory() {
        List<RiskSnapshot> snaps = snapshotRepo.findAllForTrend();

        List<RiskHistoryPoint> points = snaps.stream()
                .map(s -> RiskHistoryPoint.builder()
                        .month(s.getCalculatedAt().format(MONTH_FMT))
                        .score(s.getScore())
                        .riskLevel(s.getRiskLevel())
                        .maturityLabel(s.getMaturityLabel())
                        .calculatedAt(s.getCalculatedAt())
                        .build())
                .collect(Collectors.toList());

        int first   = points.isEmpty() ? 0 : points.get(0).getScore();
        int current = points.isEmpty() ? 0 : points.get(points.size() - 1).getScore();
        int months  = points.size();

        return RiskHistoryResponse.builder()
                .history(points)
                .currentScore(current)
                .firstScore(first)
                .improvement(current - first)
                .period(months + (months == 1 ? " month" : " months"))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Compute a live score without saving — used as fallback when no snapshots exist. */
    private RiskScoreResponse computeLiveScore() {
        log.warn("No risk snapshots found — computing live score (not persisted)");
        var frameworks  = frameworkRepo.findAllActiveOrderByCode();
        int totalCtrl   = (int) controlRepo.count();
        int coveredCtrl = (int) controlRepo.findByIsCoveredTrue().size();
        int basePct     = totalCtrl == 0 ? 0 : (int) Math.round(coveredCtrl * 100.0 / totalCtrl);

        int critGaps = (int) gapRepo.countBySeverityAndStatusNot(Severity.CRITICAL, GapStatus.resolved);
        int highGaps = (int) gapRepo.countBySeverityAndStatusNot(Severity.HIGH,     GapStatus.resolved);
        int medGaps  = (int) gapRepo.countBySeverityAndStatusNot(Severity.MEDIUM,   GapStatus.resolved);
        int lowGaps  = (int) gapRepo.countBySeverityAndStatusNot(Severity.LOW,      GapStatus.resolved);
        int fwBelow70= (int) frameworks.stream().filter(f -> f.getCoveragePercentage() < 70).count();

        int penalty  = (critGaps * PENALTY_CRITICAL) + (highGaps * PENALTY_HIGH) + (medGaps * PENALTY_MEDIUM);
        int score    = Math.max(0, Math.min(100, basePct - penalty));
        String level = riskLevel(score);

        List<FrameworkRiskEntry> byFramework = frameworks.stream()
                .map(fw -> {
                    int rs = 100 - fw.getCoveragePercentage();
                    return FrameworkRiskEntry.builder()
                            .code(fw.getCode()).name(fw.getName()).color(fw.getColor())
                            .coveragePercentage(fw.getCoveragePercentage())
                            .riskScore(rs).riskLevel(riskLevelFromRiskScore(rs))
                            .openGaps(0).criticalGaps(0)
                            .build();
                }).collect(Collectors.toList());

        return RiskScoreResponse.builder()
                .score(score).riskLevel(level).maturityLabel(maturityLabel(score))
                .maturityDescription(maturityDescription(score))
                .criticalGaps(critGaps).highGaps(highGaps).mediumGaps(medGaps).lowGaps(lowGaps)
                .totalControls(totalCtrl).coveredControls(coveredCtrl).coveragePercentage(basePct)
                .frameworksBelow70(fwBelow70).byFramework(byFramework)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    /** Map a saved snapshot → full RiskScoreResponse (for getCurrentScore). */
    private RiskScoreResponse snapshotToScoreResponse(RiskSnapshot s) {
        var frameworks = frameworkRepo.findAllActiveOrderByCode();
        List<FrameworkRiskEntry> byFramework = frameworks.stream()
                .map(fw -> {
                    int rs = 100 - fw.getCoveragePercentage();
                    return FrameworkRiskEntry.builder()
                            .code(fw.getCode()).name(fw.getName()).color(fw.getColor())
                            .coveragePercentage(fw.getCoveragePercentage())
                            .riskScore(rs).riskLevel(riskLevelFromRiskScore(rs))
                            .openGaps(0).criticalGaps(0)
                            .build();
                }).collect(Collectors.toList());

        return RiskScoreResponse.builder()
                .score(s.getScore()).riskLevel(s.getRiskLevel()).maturityLabel(s.getMaturityLabel())
                .maturityDescription(maturityDescription(s.getScore()))
                .criticalGaps(s.getCriticalGaps()).highGaps(s.getHighGaps())
                .mediumGaps(s.getMediumGaps()).lowGaps(s.getLowGaps())
                .totalControls(s.getTotalControls()).coveredControls(s.getCoveredControls())
                .coveragePercentage(s.getCoveragePercentage())
                .frameworksBelow70(s.getFrameworksBelow70())
                .byFramework(byFramework)
                .calculatedAt(s.getCalculatedAt())
                .build();
    }

    // ── Classification helpers ────────────────────────────────────────────────

    private String riskLevel(int score) {
        if (score >= 80) return "LOW";
        if (score >= 60) return "MEDIUM";
        if (score >= 40) return "HIGH";
        return "CRITICAL";
    }

    /** Risk level from a risk score (inverse of coverage — higher = worse). */
    private String riskLevelFromRiskScore(int riskScore) {
        if (riskScore <= 20) return "LOW";
        if (riskScore <= 40) return "MEDIUM";
        if (riskScore <= 60) return "HIGH";
        return "CRITICAL";
    }

    private String maturityLabel(int score) {
        if (score >= 90) return "Optimizing";
        if (score >= 75) return "Established";
        if (score >= 55) return "Establishing";
        if (score >= 35) return "Developing";
        return "Initial";
    }

    private String maturityDescription(int score) {
        if (score >= 90) return "Excellent compliance posture. Continuously improving with measurable outcomes.";
        if (score >= 75) return "Strong compliance program in place. Minor gaps remain — maintain and optimise.";
        if (score >= 55) return "Compliance programme is maturing. Focus on resolving remaining HIGH and CRITICAL gaps.";
        if (score >= 35) return "Compliance controls are partially implemented. Prioritise critical gap remediation.";
        return "Compliance programme is in early stages. Immediate action required on critical controls.";
    }
}
