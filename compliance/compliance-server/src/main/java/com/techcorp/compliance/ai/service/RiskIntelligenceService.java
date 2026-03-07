package com.techcorp.compliance.ai.service;

import com.techcorp.compliance.ai.dto.RiskIntelligenceDTOs.*;
import com.techcorp.compliance.entity.*;
import com.techcorp.compliance.repository.*;
import com.techcorp.compliance.service.RiskService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskIntelligenceService {

    private final GapRepository gapRepo;
    private final ControlRepository controlRepo;
    private final RiskService riskService;

    // ── Get Risk Intelligence ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RiskIntelligenceResponse getRiskIntelligence() {
        log.info("Getting risk intelligence analytics");

        return RiskIntelligenceResponse.builder()
                .projection(getRiskProjection())
                .alerts(getRiskAlerts())
                .criticalGaps(getCriticalGaps())
                .trend(getRiskTrend())
                .build();
    }

    // ── Risk Projection ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RiskProjection getRiskProjection() {
        var currentRisk = riskService.getCurrentScore();
        int currentScore = currentRisk.getScore();

        // Calculate velocity (gaps closed vs opened in last 30 days)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        List<Gap> allGaps = gapRepo.findAll();

        int opened = (int) allGaps.stream()
                .filter(g -> g.getIdentifiedAt() != null)
                .filter(g -> g.getIdentifiedAt().isAfter(thirtyDaysAgo))
                .count();

        int closed = (int) allGaps.stream()
                .filter(g -> g.getResolvedAt() != null)
                .filter(g -> g.getResolvedAt().isAfter(thirtyDaysAgo))
                .count();

        int netChange = closed - opened;
        int monthlyChange = (int) (netChange * 1.5); // Estimate monthly impact

        // Project future scores
        int proj30 = Math.min(100, Math.max(0, currentScore + monthlyChange));
        int proj60 = Math.min(100, Math.max(0, currentScore + (monthlyChange * 2)));
        int proj90 = Math.min(100, Math.max(0, currentScore + (monthlyChange * 3)));

        // Determine confidence
        String confidence = Math.abs(monthlyChange) < 5 ? "high"
                : Math.abs(monthlyChange) < 10 ? "medium" : "low";

        // Trend direction
        String trendDirection = monthlyChange > 3 ? "improving" : monthlyChange < -3 ? "declining" : "stable";

        return RiskProjection.builder()
                .currentScore(currentScore)
                .projected30Days(proj30)
                .projected60Days(proj60)
                .projected90Days(proj90)
                .confidence(confidence)
                .trendDirection(trendDirection)
                .build();
    }

    // ── Risk Alerts ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RiskAlert> getRiskAlerts() {
        List<RiskAlert> alerts = new ArrayList<>();
        var currentRisk = riskService.getCurrentScore();

        // Alert 1: Critical gaps
        if (currentRisk.getCriticalGaps() > 0) {
            alerts.add(RiskAlert.builder()
                    .type("critical")
                    .title("Critical Gaps Detected")
                    .message(currentRisk.getCriticalGaps()
                            + " critical compliance gaps require immediate attention")
                    .recommendation("Prioritize remediation of critical gaps to reduce compliance risk")
                    .priority(1)
                    .severity("CRITICAL")
                    .build());
        }

        // Alert 2: High risk score
        if (currentRisk.getScore() < 50) {
            alerts.add(RiskAlert.builder()
                    .type("critical")
                    .title("Low Compliance Score")
                    .message("Risk score is below 50, indicating significant compliance exposure")
                    .recommendation("Implement an accelerated remediation program")
                    .priority(1)
                    .severity("CRITICAL")
                    .build());
        }

        // Alert 3: High gaps
        if (currentRisk.getHighGaps() > 10) {
            alerts.add(RiskAlert.builder()
                    .type("warning")
                    .title("Elevated High-Risk Gaps")
                    .message(currentRisk.getHighGaps() + " high-severity gaps detected")
                    .recommendation("Review and prioritize high-risk gap remediation")
                    .priority(2)
                    .severity("HIGH")
                    .build());
        }

        // Alert 4: Aging gaps
        List<Gap> oldGaps = gapRepo.findAll().stream()
                .filter(g -> g.getStatus() != Gap.GapStatus.resolved)
                .filter(g -> g.getIdentifiedAt() != null)
                .filter(g -> ChronoUnit.DAYS.between(g.getIdentifiedAt(), LocalDateTime.now()) > 90)
                .collect(Collectors.toList());

        if (!oldGaps.isEmpty()) {
            alerts.add(RiskAlert.builder()
                    .type("warning")
                    .title("Stale Gaps Detected")
                    .message(oldGaps.size() + " gaps have been open for more than 90 days")
                    .recommendation("Review aging gaps and update remediation plans")
                    .priority(3)
                    .severity("MEDIUM")
                    .build());
        }

        // Alert 5: Coverage below 70%
        if (currentRisk.getCoveragePercentage() < 70) {
            alerts.add(RiskAlert.builder()
                    .type("warning")
                    .title("Low Control Coverage")
                    .message("Only " + currentRisk.getCoveragePercentage()
                            + "% of controls are covered")
                    .recommendation("Increase control implementation to improve coverage")
                    .priority(2)
                    .severity("MEDIUM")
                    .build());
        }

        return alerts.stream()
                .sorted(Comparator.comparingInt(RiskAlert::getPriority))
                .limit(5)
                .collect(Collectors.toList());
    }

    // ── Critical Gaps ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CriticalGap> getCriticalGaps() {
        List<Gap> openGaps = gapRepo.findByStatusNot(Gap.GapStatus.resolved);

        List<CriticalGap> criticalGaps = openGaps.stream()
                .filter(g -> g.getSeverity() == Control.Severity.CRITICAL ||
                        g.getSeverity() == Control.Severity.HIGH)
                .map(gap -> {
                    int severityWeight = gap.getSeverity() == Control.Severity.CRITICAL ? 100 : 70;

                    long daysOpen = gap.getIdentifiedAt() == null ? 0
                            : ChronoUnit.DAYS.between(gap.getIdentifiedAt(), LocalDateTime.now());

                    int riskScore = Math.min(100, severityWeight + (int) (daysOpen / 10));

                    String impactDesc = gap.getSeverity() == Control.Severity.CRITICAL
                            ? "Severe compliance exposure - requires immediate action"
                            : "Significant compliance risk - prioritize remediation";

                    // Access control and framework through relationships
                    String controlCode = gap.getControl() != null ? gap.getControl().getCode() : "UNKNOWN";
                    String controlTitle = gap.getControl() != null ? gap.getControl().getTitle() : "Unknown Control";
                    String frameworkCode = gap.getFramework() != null ? gap.getFramework().getCode() : "UNKNOWN";

                    return CriticalGap.builder()
                            .gapId(gap.getId())
                            .controlCode(controlCode)
                            .controlTitle(controlTitle)
                            .frameworkCode(frameworkCode)
                            .severity(gap.getSeverity().name())
                            .daysOpen((int) daysOpen)
                            .riskScore(riskScore)
                            .impactDescription(impactDesc)
                            .build();
                })
                .sorted(Comparator.comparingInt(CriticalGap::getRiskScore).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return criticalGaps;
    }

    // ── Risk Trend ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RiskTrend getRiskTrend() {
        // Get current and historical scores
        var riskHistory = riskService.getHistory();
        List<TrendPoint> history = new ArrayList<>();

        if (riskHistory != null && riskHistory.getHistory() != null) {
            history = riskHistory.getHistory().stream()
                    .map(h -> TrendPoint.builder()
                            .date(h.getMonth())
                            .score(h.getScore())
                            .gapsOpened(0) // Could be calculated from gap data
                            .gapsClosed(0) // Could be calculated from gap data
                            .build())
                    .collect(Collectors.toList());
        }

        // Calculate trend direction
        String direction = "stable";
        int changePercentage = 0;

        if (history.size() >= 2) {
            int oldestScore = history.get(0).getScore();
            int newestScore = history.get(history.size() - 1).getScore();
            changePercentage = newestScore - oldestScore;

            if (changePercentage > 5)
                direction = "improving";
            else if (changePercentage < -5)
                direction = "declining";
        }

        return RiskTrend.builder()
                .direction(direction)
                .changePercentage(changePercentage)
                .period("last 90 days")
                .history(history)
                .build();
    }
}
