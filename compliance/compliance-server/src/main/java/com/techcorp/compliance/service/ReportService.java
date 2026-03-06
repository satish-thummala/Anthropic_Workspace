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

    private final ReportRepository reportRepo;
    private final FrameworkRepository frameworkRepo;
    private final GapRepository gapRepo;
    private final RiskService riskService;
    private final UserRepository userRepo;
    private final ObjectMapper mapper;

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
     * In production, this would return actual file bytes.
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
        // Get gaps data
        List<Gap> gaps = request.getFrameworkCode() != null
                ? gapRepo.findByFrameworkCode(request.getFrameworkCode())
                : gapRepo.findAllWithDetails();

        // Build report content
        StringBuilder content = new StringBuilder();
        content.append("GAP ANALYSIS REPORT\n");
        content.append("Generated: ").append(LocalDateTime.now()).append("\n\n");
        content.append("Total Gaps: ").append(gaps.size()).append("\n");
        // ... more content generation

        return content.toString();
    }

    private String generateCoverageReport(GenerateReportRequest request) {
        List<Framework> frameworks = request.getFrameworkCode() != null
                ? List.of(frameworkRepo.findByCode(request.getFrameworkCode())
                        .orElseThrow(() -> new RuntimeException("Framework not found")))
                : frameworkRepo.findAll();

        StringBuilder content = new StringBuilder();
        content.append("COVERAGE REPORT\n");
        // ... content generation
        return content.toString();
    }

    private String generateRiskReport(GenerateReportRequest request) {
        var riskScore = riskService.getCurrentScore();

        StringBuilder content = new StringBuilder();
        content.append("RISK ASSESSMENT REPORT\n");
        content.append("Current Score: ").append(riskScore.getScore()).append("\n");
        // ... content generation
        return content.toString();
    }

    private String generateAuditReport(GenerateReportRequest request) {
        return "AUDIT TRAIL REPORT\n...";
    }

    private String generatePolicyReport(GenerateReportRequest request) {
        return "POLICY UPDATE SUMMARY\n...";
    }

    private String generateExecutiveReport(GenerateReportRequest request) {
        return "EXECUTIVE SUMMARY\n...";
    }

    private Map<String, Object> buildContentSummary(GenerateReportRequest request) {
        Map<String, Object> summary = new HashMap<>();

        switch (request.getType()) {
            case gap:
                List<Gap> gaps = gapRepo.findAllWithDetails();
                summary.put("totalGaps", gaps.size());
                summary.put("criticalGaps", gaps.stream()
                        .filter(g -> g.getSeverity() == Control.Severity.CRITICAL)
                        .count());
                break;
            case coverage:
                List<Framework> frameworks = frameworkRepo.findAll();
                summary.put("frameworks", frameworks.stream()
                        .map(Framework::getCode)
                        .collect(Collectors.toList()));
                break;
            case risk:
                var riskScore = riskService.getCurrentScore();
                summary.put("riskScore", riskScore.getScore());
                summary.put("riskLevel", riskScore.getRiskLevel());
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
