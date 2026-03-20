package com.techcorp.compliance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techcorp.compliance.dto.ReportDTOs.*;
import com.techcorp.compliance.entity.*;
import com.techcorp.compliance.entity.Report.ReportFormat;
import com.techcorp.compliance.entity.Report.ReportStatus;
import com.techcorp.compliance.entity.Report.ReportType;
import com.techcorp.compliance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository    reportRepo;
    private final FrameworkRepository frameworkRepo;
    private final GapRepository       gapRepo;
    private final RiskService         riskService;
    private final UserRepository      userRepo;
    private final AuditLogRepository  auditLogRepo;
    private final ObjectMapper        mapper;

    // ── READ ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/reports
     * Returns all reports, newest first.
     */
    @Transactional(readOnly = true)
    public List<ReportResponse> getAll() {
        return reportRepo.findAllWithDetails().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/v1/reports/{id}
     * Returns single report by ID.
     */
    @Transactional(readOnly = true)
    public ReportResponse getById(String id) {
        Report report = reportRepo.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));
        return toResponse(report);
    }

    /**
     * GET /api/v1/reports/stats
     * Returns statistics about reports.
     */
    @Transactional(readOnly = true)
    public ReportStats getStats() {
        List<Report> all = reportRepo.findAll();

        Map<String, Integer> byType = Arrays.stream(ReportType.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        type -> (int) all.stream()
                                .filter(r -> r.getType() == type)
                                .count()));

        List<ReportResponse> recent = reportRepo.findRecentReports().stream()
                .limit(10)
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ReportStats.builder()
                .totalReports(all.size())
                .readyReports((int) all.stream().filter(r -> r.getStatus() == ReportStatus.ready).count())
                .generatingReports((int) all.stream().filter(r -> r.getStatus() == ReportStatus.generating).count())
                .failedReports((int) all.stream().filter(r -> r.getStatus() == ReportStatus.failed).count())
                .byType(byType)
                .recentReports(recent)
                .build();
    }

    /**
     * GET /api/v1/reports/types
     * Returns available report types with descriptions.
     */
    public List<ReportTypeInfo> getAvailableTypes() {
        return List.of(
                ReportTypeInfo.builder()
                        .id("gap")
                        .label("Gap Analysis Report")
                        .description("Full gap summary with remediation suggestions")
                        .availableFormats(List.of("PDF", "Excel"))
                        .build(),
                ReportTypeInfo.builder()
                        .id("coverage")
                        .label("Coverage Report")
                        .description("Framework-by-framework compliance coverage")
                        .availableFormats(List.of("PDF"))
                        .build(),
                ReportTypeInfo.builder()
                        .id("risk")
                        .label("Risk Assessment")
                        .description("Risk scoring with trend analysis")
                        .availableFormats(List.of("PDF", "Excel"))
                        .build(),
                ReportTypeInfo.builder()
                        .id("audit")
                        .label("Audit Trail")
                        .description("Evidence summary for auditor review")
                        .availableFormats(List.of("PDF"))
                        .build(),
                ReportTypeInfo.builder()
                        .id("policy")
                        .label("Policy Update Summary")
                        .description("Suggested policy improvements")
                        .availableFormats(List.of("PDF"))
                        .build(),
                ReportTypeInfo.builder()
                        .id("executive")
                        .label("Executive Summary")
                        .description("High-level compliance posture overview")
                        .availableFormats(List.of("PDF"))
                        .build());
    }

    // ── GENERATE ──────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/reports/generate
     * Initiates report generation asynchronously.
     * Returns immediately with report in 'generating' status.
     */
    @Transactional
    public GenerateReportResponse generate(GenerateReportRequest request) {
        log.info("Generating report: type={}, format={}", request.getType(), request.getFormat());

        // Get current user
        User user = getCurrentUser();

        // Create report record in 'generating' status
        Report report = Report.builder()
                .name(buildReportName(request))
                .type(request.getType())
                .format(request.getFormat() != null ? request.getFormat() : ReportFormat.PDF)
                .status(ReportStatus.generating)
                .generatedBy(user)
                .parameters(toJson(request))
                .build();

        reportRepo.save(report);

        // Trigger async generation
        generateAsync(report.getId(), request);

        return GenerateReportResponse.builder()
                .reportId(report.getId())
                .status("generating")
                .message("Report generation started")
                .estimatedSeconds(estimateGenerationTime(request.getType()))
                .build();
    }

    /**
     * Async method that actually generates the report content.
     * Runs in background thread.
     */
    @Async
    @Transactional
    public void generateAsync(String reportId, GenerateReportRequest request) {
        try {
            log.info("Starting async generation for report {}", reportId);

            // Simulate multi-step process
            Thread.sleep(1000); // Scanning documents
            Thread.sleep(800); // Mapping to frameworks
            Thread.sleep(700); // Identifying gaps
            Thread.sleep(600); // Calculating risk
            Thread.sleep(900); // Generating report

            Report report = reportRepo.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));

            // Generate content based on type
            String content = generateReportContent(request);
            Map<String, Object> summary = buildContentSummary(request);

            // Simulate file storage
            String filePath = String.format("/reports/%s_%s_%s.%s",
                    request.getType().name(),
                    UUID.randomUUID().toString().substring(0, 8),
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                    request.getFormat().name().toLowerCase());

            // Calculate simulated file size
            long fileSize = (long) (500_000 + Math.random() * 2_000_000);

            // Update report
            report.setStatus(ReportStatus.ready);
            report.setFilePath(filePath);
            report.setFileSizeBytes(fileSize);
            report.setFileSizeLabel(formatBytes(fileSize));
            report.setContentSummary(toJson(summary));

            reportRepo.save(report);

            log.info("Report {} generation complete", reportId);

        } catch (Exception e) {
            log.error("Report generation failed for {}", reportId, e);

            Report report = reportRepo.findById(reportId).orElse(null);
            if (report != null) {
                report.setStatus(ReportStatus.failed);
                report.setErrorMessage(e.getMessage());
                reportRepo.save(report);
            }
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    /**
     * DELETE /api/v1/reports/{id}
     * Deletes a report.
     */
    @Transactional
    public void delete(String id) {
        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));

        // TODO: Delete physical file if stored
        // fileStorageService.delete(report.getFilePath());

        reportRepo.delete(report);
        log.info("Deleted report {}", id);
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/reports/{id}/download
     * Returns file path for download.
     */
    @Transactional(readOnly = true)
    public String getDownloadPath(String id) {
        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));

        if (report.getStatus() != ReportStatus.ready) {
            throw new RuntimeException("Report is not ready for download. Status: " + report.getStatus());
        }

        return report.getFilePath();
    }

    /**
     * GET /api/v1/reports/{id}/content
     * Returns the full Markdown content of a report for browser download.
     */
    @Transactional(readOnly = true)
    public String getContent(String id) {
        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));

        if (report.getStatus() != ReportStatus.ready) {
            throw new RuntimeException("Report is not ready. Status: " + report.getStatus());
        }

        // Re-generate the content from live data — always fresh
        GenerateReportRequest req = new GenerateReportRequest();
        req.setType(report.getType());
        req.setFormat(report.getFormat());

        // Parse stored parameters for framework filter
        Map<String, Object> params = parseJson(report.getParameters());
        if (params.containsKey("frameworkCode")) {
            req.setFrameworkCode((String) params.get("frameworkCode"));
        }

        return generateReportContent(req);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private String buildReportName(GenerateReportRequest request) {
        String typeName = getAvailableTypes().stream()
                .filter(t -> t.getId().equals(request.getType().name()))
                .findFirst()
                .map(ReportTypeInfo::getLabel)
                .orElse(request.getType().name());

        String date = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("MMM d, yyyy"));

        return String.format("%s — %s", typeName, date);
    }

    private String generateReportContent(GenerateReportRequest request) {
        // In production, this would use a PDF library like iText or Apache PDFBox
        // For now, return placeholder content

        switch (request.getType()) {
            case gap:
                return generateGapReport(request);
            case coverage:
                return generateCoverageReport(request);
            case risk:
                return generateRiskReport(request);
            case audit:
                return generateAuditReport(request);
            case policy:
                return generatePolicyReport(request);
            case executive:
                return generateExecutiveReport(request);
            default:
                return "Report content";
        }
    }

    private String generateGapReport(GenerateReportRequest request) {
        List<Gap> gaps = request.getFrameworkCode() != null
                ? gapRepo.findByFrameworkCode(request.getFrameworkCode())
                : gapRepo.findAllWithDetails();

        String fw = request.getFrameworkCode() != null ? request.getFrameworkCode() : "All Frameworks";
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        long critical = gaps.stream().filter(g -> g.getSeverity() == Control.Severity.CRITICAL).count();
        long high     = gaps.stream().filter(g -> g.getSeverity() == Control.Severity.HIGH).count();
        long medium   = gaps.stream().filter(g -> g.getSeverity() == Control.Severity.MEDIUM).count();
        long low      = gaps.stream().filter(g -> g.getSeverity() == Control.Severity.LOW).count();
        long open     = gaps.stream().filter(g -> g.getStatus() == Gap.GapStatus.open).count();
        long inProg   = gaps.stream().filter(g -> g.getStatus() == Gap.GapStatus.in_progress).count();
        long resolved = gaps.stream().filter(g -> g.getStatus() == Gap.GapStatus.resolved).count();

        StringBuilder sb = new StringBuilder();
        sb.append("# Gap Analysis Report\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Framework** | ").append(fw).append(" |\n");
        sb.append("| **Total Gaps** | ").append(gaps.size()).append(" |\n");
        sb.append("| **Generated By** | ").append(resolveCurrentUserName()).append(" |\n\n");

        sb.append("---\n\n## Executive Summary\n\n");
        sb.append("This report presents all identified compliance gaps");
        if (!fw.equals("All Frameworks")) sb.append(" for the **").append(fw).append("** framework");
        sb.append(". A total of **").append(gaps.size()).append(" gaps** have been identified across all frameworks.\n\n");

        sb.append("## Severity Breakdown\n\n");
        sb.append("| Severity | Count | % of Total |\n|---|---|---|\n");
        int total = gaps.size();
        sb.append("| CRITICAL | ").append(critical).append(" | ").append(pct(critical, total)).append("% |\n");
        sb.append("| HIGH | ").append(high).append(" | ").append(pct(high, total)).append("% |\n");
        sb.append("| MEDIUM | ").append(medium).append(" | ").append(pct(medium, total)).append("% |\n");
        sb.append("| LOW | ").append(low).append(" | ").append(pct(low, total)).append("% |\n\n");

        sb.append("## Status Breakdown\n\n");
        sb.append("| Status | Count |\n|---|---|\n");
        sb.append("| Open | ").append(open).append(" |\n");
        sb.append("| In Progress | ").append(inProg).append(" |\n");
        sb.append("| Resolved | ").append(resolved).append(" |\n\n");

        sb.append("## Gap Details\n\n");
        sb.append("| # | Framework | Control | Title | Severity | Status | Identified |\n");
        sb.append("|---|---|---|---|---|---|---|\n");
        for (int i = 0; i < gaps.size(); i++) {
            Gap g = gaps.get(i);
            sb.append("| ").append(i + 1).append(" | ")
              .append(g.getFramework().getCode()).append(" | ")
              .append(g.getControl().getCode()).append(" | ")
              .append(g.getControl().getTitle()).append(" | ")
              .append(g.getSeverity()).append(" | ")
              .append(g.getStatus().name().replace("_", " ")).append(" | ")
              .append(g.getIdentifiedAt() != null ? g.getIdentifiedAt().toLocalDate() : "—").append(" |\n");
        }

        sb.append("\n## Critical Gaps — Remediation Required\n\n");
        gaps.stream()
            .filter(g -> g.getSeverity() == Control.Severity.CRITICAL)
            .limit(10)
            .forEach(g -> {
                sb.append("### ").append(g.getControl().getCode())
                  .append(" — ").append(g.getControl().getTitle()).append("\n");
                sb.append("- **Framework:** ").append(g.getFramework().getName()).append("\n");
                sb.append("- **Status:** ").append(g.getStatus().name().replace("_", " ")).append("\n");
                if (g.getDescription() != null)
                    sb.append("- **Description:** ").append(g.getDescription()).append("\n");
                if (g.getAiSuggestion() != null)
                    sb.append("- **Recommended Action:** ").append(g.getAiSuggestion()).append("\n");
                sb.append("\n");
            });

        sb.append("---\n*Report generated by ComplianceAI Platform*\n");
        return sb.toString();
    }

    private String generateCoverageReport(GenerateReportRequest request) {
        List<Framework> frameworks = request.getFrameworkCode() != null
                ? List.of(frameworkRepo.findByCode(request.getFrameworkCode())
                        .orElseThrow(() -> new RuntimeException("Framework not found")))
                : frameworkRepo.findAllActiveOrderByCode();

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        int totalControls  = frameworks.stream().mapToInt(Framework::getTotalControls).sum();
        int coveredControls = frameworks.stream().mapToInt(Framework::getCoveredControls).sum();
        int overallPct     = totalControls > 0 ? (coveredControls * 100) / totalControls : 0;

        StringBuilder sb = new StringBuilder();
        sb.append("# Compliance Coverage Report\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Overall Coverage** | ").append(overallPct).append("% |\n");
        sb.append("| **Controls Covered** | ").append(coveredControls).append(" / ").append(totalControls).append(" |\n");
        sb.append("| **Frameworks** | ").append(frameworks.size()).append(" |\n\n");

        sb.append("---\n\n## Framework Coverage Summary\n\n");
        sb.append("| Framework | Version | Controls | Covered | Gaps | Coverage |\n");
        sb.append("|---|---|---|---|---|---|\n");
        for (Framework fw : frameworks) {
            int gaps = fw.getTotalControls() - fw.getCoveredControls();
            sb.append("| ").append(fw.getName()).append(" | ")
              .append(fw.getVersion()).append(" | ")
              .append(fw.getTotalControls()).append(" | ")
              .append(fw.getCoveredControls()).append(" | ")
              .append(gaps).append(" | ")
              .append(fw.getCoveragePercentage()).append("% |\n");
        }

        sb.append("\n## Coverage Progress Bar\n\n");
        for (Framework fw : frameworks) {
            int pct = fw.getCoveragePercentage();
            int filled = pct / 5;
            String bar = "█".repeat(filled) + "░".repeat(20 - filled);
            sb.append("**").append(fw.getCode()).append("** `").append(bar)
              .append("` ").append(pct).append("%\n\n");
        }

        sb.append("## Framework Details\n\n");
        for (Framework fw : frameworks) {
            sb.append("### ").append(fw.getName()).append(" (").append(fw.getCode()).append(")\n\n");
            sb.append("| Attribute | Value |\n|---|---|\n");
            sb.append("| Version | ").append(fw.getVersion()).append(" |\n");
            sb.append("| Industry | ").append(fw.getIndustry() != null ? fw.getIndustry() : "All").append(" |\n");
            sb.append("| Total Controls | ").append(fw.getTotalControls()).append(" |\n");
            sb.append("| Covered Controls | ").append(fw.getCoveredControls()).append(" |\n");
            sb.append("| Open Gaps | ").append(fw.getTotalControls() - fw.getCoveredControls()).append(" |\n");
            sb.append("| Coverage | ").append(fw.getCoveragePercentage()).append("% |\n\n");

            String status = fw.getCoveragePercentage() >= 80 ? "GOOD — above 80% threshold"
                          : fw.getCoveragePercentage() >= 60 ? "ATTENTION — approaching threshold"
                          : "AT RISK — below 60%";
            sb.append("**Status:** ").append(status).append("\n\n");
        }

        sb.append("---\n*Report generated by ComplianceAI Platform*\n");
        return sb.toString();
    }

    private String generateRiskReport(GenerateReportRequest request) {
        var riskScore = riskService.getCurrentScore();
        List<Gap> criticalGaps = gapRepo.findAllActive().stream()
                .filter(g -> g.getSeverity() == Control.Severity.CRITICAL)
                .collect(Collectors.toList());
        List<Gap> highGaps = gapRepo.findAllActive().stream()
                .filter(g -> g.getSeverity() == Control.Severity.HIGH)
                .collect(Collectors.toList());

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        StringBuilder sb = new StringBuilder();
        sb.append("# Risk Assessment Report\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Risk Score** | ").append(riskScore.getScore()).append("/100 |\n");
        sb.append("| **Risk Level** | ").append(riskScore.getRiskLevel()).append(" |\n");
        sb.append("| **Maturity Level** | ").append(riskScore.getMaturityLabel()).append(" |\n\n");

        sb.append("---\n\n## Overall Risk Posture\n\n");
        sb.append(riskScore.getMaturityDescription()).append("\n\n");

        sb.append("## Risk Score Breakdown\n\n");
        sb.append("| Factor | Value | Impact |\n|---|---|---|\n");
        sb.append("| Critical Gaps | ").append(riskScore.getCriticalGaps()).append(" | -").append(riskScore.getCriticalGaps() * 8).append(" pts |\n");
        sb.append("| High Gaps | ").append(riskScore.getHighGaps()).append(" | -").append(riskScore.getHighGaps() * 4).append(" pts |\n");
        sb.append("| Medium Gaps | ").append(riskScore.getMediumGaps()).append(" | -").append(riskScore.getMediumGaps() * 2).append(" pts |\n");
        sb.append("| Low Gaps | ").append(riskScore.getLowGaps()).append(" | -").append(riskScore.getLowGaps()).append(" pts |\n");
        sb.append("| Coverage % | ").append(riskScore.getCoveragePercentage()).append("% | baseline |\n\n");

        sb.append("## Per-Framework Risk\n\n");
        sb.append("| Framework | Coverage | Risk Score | Risk Level |\n|---|---|---|---|\n");
        if (riskScore.getByFramework() != null) {
            riskScore.getByFramework().forEach(f ->
                sb.append("| ").append(f.getName()).append(" | ")
                  .append(f.getCoveragePercentage()).append("% | ")
                  .append(f.getRiskScore()).append(" | ")
                  .append(f.getRiskLevel()).append(" |\n")
            );
        }

        sb.append("\n## Critical Gaps Driving Risk\n\n");
        if (criticalGaps.isEmpty()) {
            sb.append("No critical gaps — excellent posture.\n\n");
        } else {
            criticalGaps.stream().limit(10).forEach(g -> {
                sb.append("- **[").append(g.getFramework().getCode()).append("] ")
                  .append(g.getControl().getCode()).append("** — ")
                  .append(g.getControl().getTitle()).append(" (")
                  .append(g.getStatus().name().replace("_", " ")).append(")\n");
            });
            sb.append("\n");
        }

        sb.append("## Recommended Actions\n\n");
        sb.append("1. **Immediate:** Resolve all ").append(criticalGaps.size())
          .append(" critical gaps to recover approximately ").append(criticalGaps.size() * 8)
          .append(" risk score points.\n");
        sb.append("2. **Short-term:** Address ").append(highGaps.size())
          .append(" high-severity gaps to recover approximately ").append(highGaps.size() * 4)
          .append(" points.\n");
        sb.append("3. **Ongoing:** Maintain coverage above 80% across all frameworks.\n\n");

        sb.append("---\n*Report generated by ComplianceAI Platform*\n");
        return sb.toString();
    }

    private String generateAuditReport(GenerateReportRequest request) {
        // Pull recent audit events — last 30 days by default
        var recentLogs = auditLogRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, 200)).getContent();

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        long loginCount   = recentLogs.stream().filter(l -> l.getAction() == AuditLog.Action.USER_LOGIN).count();
        long gapChanges   = recentLogs.stream().filter(l -> l.getAction() == AuditLog.Action.GAP_STATUS_CHANGED).count();
        long docUploads   = recentLogs.stream().filter(l -> l.getAction() == AuditLog.Action.DOCUMENT_UPLOADED).count();
        long failures     = recentLogs.stream().filter(l -> l.getOutcome() == AuditLog.Outcome.FAILURE).count();

        StringBuilder sb = new StringBuilder();
        sb.append("# Audit Trail Report\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Events Included** | ").append(recentLogs.size()).append(" most recent |\n");
        sb.append("| **Login Events** | ").append(loginCount).append(" |\n");
        sb.append("| **Gap Status Changes** | ").append(gapChanges).append(" |\n");
        sb.append("| **Document Uploads** | ").append(docUploads).append(" |\n");
        sb.append("| **Failures Recorded** | ").append(failures).append(" |\n\n");

        sb.append("---\n\n## Summary\n\n");
        sb.append("This report is an export of the platform audit trail — an immutable log of every ");
        sb.append("significant user action. All events are recorded with the acting user, timestamp, ");
        sb.append("entity affected, old and new values where applicable, and the client IP address.\n\n");

        sb.append("## Event Log\n\n");
        sb.append("| Timestamp | User | Action | Entity | Description | Result |\n");
        sb.append("|---|---|---|---|---|---|\n");
        recentLogs.forEach(log -> {
            String action = log.getAction().name().replace("_", " ");
            sb.append("| ").append(log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm:ss"))).append(" | ")
              .append(log.getUserName() != null ? log.getUserName() : "—").append(" | ")
              .append(action).append(" | ")
              .append(log.getEntityType() != null ? log.getEntityType() : "—").append(" | ")
              .append(log.getDescription() != null ? log.getDescription() : "—").append(" | ")
              .append(log.getOutcome().name()).append(" |\n");
        });

        sb.append("\n## Failures\n\n");
        var failedLogs = recentLogs.stream()
                .filter(l -> l.getOutcome() == AuditLog.Outcome.FAILURE)
                .collect(Collectors.toList());
        if (failedLogs.isEmpty()) {
            sb.append("No failures recorded in this period.\n\n");
        } else {
            failedLogs.forEach(log -> {
                sb.append("- **").append(log.getCreatedAt().toLocalDate()).append("** — ")
                  .append(log.getAction().name().replace("_", " ")).append(" by ")
                  .append(log.getUserName() != null ? log.getUserName() : "unknown")
                  .append(": ").append(log.getErrorMessage() != null ? log.getErrorMessage() : "Unknown error").append("\n");
            });
            sb.append("\n");
        }

        sb.append("---\n*This audit trail report is generated from the immutable audit_logs table.*\n");
        sb.append("*Records are written with REQUIRES_NEW propagation and cannot be modified.*\n");
        return sb.toString();
    }

    private String generatePolicyReport(GenerateReportRequest request) {
        List<Framework> frameworks = frameworkRepo.findAllActiveOrderByCode();
        List<Gap> policyGaps = gapRepo.findAllActive().stream()
                .filter(g -> "missing_control".equals(g.getGapType().name()))
                .collect(Collectors.toList());

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        StringBuilder sb = new StringBuilder();
        sb.append("# Policy Update Summary\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Frameworks Reviewed** | ").append(frameworks.size()).append(" |\n");
        sb.append("| **Controls Requiring Policy** | ").append(policyGaps.size()).append(" |\n\n");

        sb.append("---\n\n## Purpose\n\n");
        sb.append("This report identifies compliance controls that are not yet covered by existing ");
        sb.append("policy documentation. Each item represents a control where a policy document ");
        sb.append("should be created or updated to provide evidence of compliance.\n\n");

        sb.append("## Policy Gaps by Framework\n\n");
        for (Framework fw : frameworks) {
            List<Gap> fwGaps = policyGaps.stream()
                    .filter(g -> g.getFramework().getId().equals(fw.getId()))
                    .collect(Collectors.toList());

            if (fwGaps.isEmpty()) continue;

            sb.append("### ").append(fw.getName()).append("\n\n");
            sb.append("| Control | Title | Severity | Recommended Policy |\n|---|---|---|---|\n");
            fwGaps.forEach(g -> {
                String policyHint = suggestPolicyType(g.getControl().getTitle());
                sb.append("| ").append(g.getControl().getCode()).append(" | ")
                  .append(g.getControl().getTitle()).append(" | ")
                  .append(g.getSeverity()).append(" | ")
                  .append(policyHint).append(" |\n");
            });
            sb.append("\n");
        }

        sb.append("## Recommended Policy Documents\n\n");
        sb.append("Based on the gaps identified above, the following policy documents should be created:\n\n");
        sb.append("1. **Access Control Policy** — covers access management, authentication, and privilege controls\n");
        sb.append("2. **Incident Response Policy** — covers security incident detection, response, and notification\n");
        sb.append("3. **Data Protection Policy** — covers data classification, handling, retention, and subject rights\n");
        sb.append("4. **Acceptable Use Policy** — covers IT system and device usage rules\n");
        sb.append("5. **Business Continuity Policy** — covers RTO/RPO, backup procedures, and disaster recovery\n\n");
        sb.append("> Use the **Policy Generator** in this platform to auto-generate any of the above.\n\n");

        sb.append("---\n*Report generated by ComplianceAI Platform*\n");
        return sb.toString();
    }

    private String generateExecutiveReport(GenerateReportRequest request) {
        var riskScore = riskService.getCurrentScore();
        List<Framework> frameworks = frameworkRepo.findAllActiveOrderByCode();
        List<Gap> activeGaps = gapRepo.findAllActive();
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

        long critical = activeGaps.stream().filter(g -> g.getSeverity() == Control.Severity.CRITICAL).count();
        long high     = activeGaps.stream().filter(g -> g.getSeverity() == Control.Severity.HIGH).count();

        int totalControls  = frameworks.stream().mapToInt(Framework::getTotalControls).sum();
        int coveredControls = frameworks.stream().mapToInt(Framework::getCoveredControls).sum();
        int overallPct     = totalControls > 0 ? (coveredControls * 100) / totalControls : 0;

        StringBuilder sb = new StringBuilder();
        sb.append("# Executive Compliance Summary\n\n");
        sb.append("| Field | Value |\n|---|---|\n");
        sb.append("| **Generated** | ").append(date).append(" |\n");
        sb.append("| **Risk Score** | ").append(riskScore.getScore()).append("/100 |\n");
        sb.append("| **Risk Level** | ").append(riskScore.getRiskLevel()).append(" |\n");
        sb.append("| **Maturity** | ").append(riskScore.getMaturityLabel()).append(" |\n");
        sb.append("| **Overall Coverage** | ").append(overallPct).append("% |\n\n");

        sb.append("---\n\n## Overall Posture\n\n");
        sb.append(riskScore.getMaturityDescription()).append("\n\n");
        sb.append("The organisation currently has **").append(activeGaps.size())
          .append(" active compliance gaps** across ").append(frameworks.size()).append(" frameworks, ");
        sb.append("with **").append(critical).append(" critical** and **").append(high)
          .append(" high-severity** items requiring attention.\n\n");

        sb.append("## Framework Status\n\n");
        sb.append("| Framework | Coverage | Status |\n|---|---|---|\n");
        frameworks.forEach(fw -> {
            String status = fw.getCoveragePercentage() >= 80 ? "✓ Good"
                          : fw.getCoveragePercentage() >= 60 ? "⚠ Attention needed"
                          : "✗ At risk";
            sb.append("| ").append(fw.getName()).append(" | ")
              .append(fw.getCoveragePercentage()).append("% | ")
              .append(status).append(" |\n");
        });

        sb.append("\n## Top Risks\n\n");
        activeGaps.stream()
                .filter(g -> g.getSeverity() == Control.Severity.CRITICAL)
                .limit(3)
                .forEach(g -> sb.append("1. **[").append(g.getFramework().getCode()).append("] ")
                    .append(g.getControl().getCode()).append("** — ").append(g.getControl().getTitle()).append("\n"));
        if (critical == 0) sb.append("No critical risks — strong compliance posture.\n");
        sb.append("\n");

        sb.append("## Recommended Actions\n\n");
        sb.append("| Priority | Action | Owner | Timeline |\n|---|---|---|---|\n");
        if (critical > 0)
            sb.append("| 1 | Resolve ").append(critical).append(" critical gaps | CISO | Immediate |\n");
        if (high > 0)
            sb.append("| 2 | Address ").append(high).append(" high-severity gaps | Security Team | 30 days |\n");
        sb.append("| 3 | Upload policy documentation to close coverage gaps | Compliance Team | 60 days |\n");
        sb.append("| 4 | Run full gap analysis after remediation | Compliance Team | 90 days |\n\n");

        sb.append("## Outlook\n\n");
        String outlook = riskScore.getScore() >= 70
                ? "Compliance posture is strong. Continue systematic remediation to achieve Established maturity."
                : riskScore.getScore() >= 50
                ? "Compliance posture is developing. Focus on critical and high gaps to improve the risk score."
                : "Immediate action is required. A dedicated remediation programme should be initiated with executive sponsorship.";
        sb.append(outlook).append("\n\n");

        sb.append("---\n*This report was generated by ComplianceAI Platform for board-level review.*\n");
        return sb.toString();
    }

    private Map<String, Object> buildContentSummary(GenerateReportRequest request) {
        Map<String, Object> summary = new HashMap<>();

        switch (request.getType()) {
            case gap:
                List<Gap> gaps = gapRepo.findAllWithDetails();
                long critical = gaps.stream().filter(g -> g.getSeverity() == Control.Severity.CRITICAL).count();
                summary.put("totalGaps", gaps.size());
                summary.put("criticalGaps", critical);
                summary.put("highGaps", gaps.stream().filter(g -> g.getSeverity() == Control.Severity.HIGH).count());
                summary.put("openGaps", gaps.stream().filter(g -> g.getStatus() == Gap.GapStatus.open).count());
                break;
            case coverage:
                List<Framework> frameworks = frameworkRepo.findAll();
                int total = frameworks.stream().mapToInt(Framework::getTotalControls).sum();
                int covered = frameworks.stream().mapToInt(Framework::getCoveredControls).sum();
                summary.put("frameworks", frameworks.stream().map(Framework::getCode).collect(Collectors.toList()));
                summary.put("totalControls", total);
                summary.put("coveredControls", covered);
                summary.put("coveragePercentage", total > 0 ? (covered * 100) / total : 0);
                break;
            case risk:
                var riskScore = riskService.getCurrentScore();
                summary.put("riskScore", riskScore.getScore());
                summary.put("riskLevel", riskScore.getRiskLevel());
                summary.put("maturityLabel", riskScore.getMaturityLabel());
                break;
            case audit:
                long eventCount = auditLogRepo.count();
                summary.put("totalEvents", eventCount);
                summary.put("period", "Last 200 events");
                break;
            case policy:
                long policyGaps = gapRepo.findAllActive().stream()
                        .filter(g -> "missing_control".equals(g.getGapType().name())).count();
                summary.put("controlsRequiringPolicy", policyGaps);
                break;
            case executive:
                var exec = riskService.getCurrentScore();
                summary.put("riskScore", exec.getScore());
                summary.put("riskLevel", exec.getRiskLevel());
                summary.put("activeGaps", gapRepo.findAllActive().size());
                break;
        }

        return summary;
    }

    private int estimateGenerationTime(ReportType type) {
        // Estimated seconds for each report type
        return switch (type) {
            case gap, coverage -> 5;
            case risk -> 4;
            case audit -> 6;
            case policy, executive -> 3;
        };
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1_048_576)
            return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / 1_048_576.0);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String email = auth.getName();
        return userRepo.findByEmail(email).orElse(null);
    }

    private String resolveCurrentUserName() {
        User u = getCurrentUser();
        return u != null ? u.getName() : "System";
    }

    private int pct(long part, int total) {
        return total == 0 ? 0 : (int) Math.round(part * 100.0 / total);
    }

    private String suggestPolicyType(String controlTitle) {
        String t = controlTitle.toLowerCase();
        if (t.contains("access") || t.contains("authentication") || t.contains("password") || t.contains("privilege"))
            return "Access Control Policy";
        if (t.contains("incident") || t.contains("breach") || t.contains("response"))
            return "Incident Response Policy";
        if (t.contains("data") || t.contains("privacy") || t.contains("personal") || t.contains("gdpr") || t.contains("consent"))
            return "Data Protection Policy";
        if (t.contains("backup") || t.contains("recovery") || t.contains("continuity") || t.contains("disaster"))
            return "Business Continuity Policy";
        if (t.contains("device") || t.contains("acceptable") || t.contains("email") || t.contains("internet"))
            return "Acceptable Use Policy";
        return "Information Security Policy";
    }

    private String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private ReportResponse toResponse(Report r) {
        Map<String, Object> summary = parseJson(r.getContentSummary());
        Map<String, Object> params = parseJson(r.getParameters());

        return ReportResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .type(r.getType().name())
                .format(r.getFormat().name())
                .fileSizeLabel(r.getFileSizeLabel())
                .status(r.getStatus().name())
                .errorMessage(r.getErrorMessage())
                .generatedById(r.getGeneratedBy() != null ? r.getGeneratedBy().getId() : null)
                .generatedByName(r.getGeneratedBy() != null ? r.getGeneratedBy().getName() : null)
                .generatedAt(r.getGeneratedAt())
                .contentSummary(summary)
                .parameters(params)
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank())
            return Map.of();
        try {
            return mapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
