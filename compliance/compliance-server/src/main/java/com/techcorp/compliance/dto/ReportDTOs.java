package com.techcorp.compliance.dto;

import com.techcorp.compliance.entity.Report.ReportFormat;
import com.techcorp.compliance.entity.Report.ReportStatus;
import com.techcorp.compliance.entity.Report.ReportType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportDTOs {

    // ── RESPONSE ──────────────────────────────────────────────────────────────

    /**
     * Full report record returned by GET /reports and GET /reports/{id}.
     */
    @Data
    @Builder
    public static class ReportResponse {
        private String id;
        private String name;
        private String type;          // gap, coverage, risk, audit, policy, executive
        private String format;        // PDF, Excel, Word
        private String fileSizeLabel; // e.g., "1.2 MB"
        private String status;        // generating, ready, failed
        private String errorMessage;
        
        private Long generatedById;
        private String generatedByName;
        private LocalDateTime generatedAt;
        
        private Map<String, Object> contentSummary;
        private Map<String, Object> parameters;
    }

    /**
     * Summary stats for reports.
     */
    @Data
    @Builder
    public static class ReportStats {
        private int totalReports;
        private int readyReports;
        private int generatingReports;
        private int failedReports;
        
        private Map<String, Integer> byType;  // { "gap": 5, "coverage": 3, ... }
        private List<ReportResponse> recentReports;
    }

    /**
     * Available report types with descriptions.
     */
    @Data
    @Builder
    public static class ReportTypeInfo {
        private String id;
        private String label;
        private String description;
        private List<String> availableFormats;
    }

    // ── REQUESTS ──────────────────────────────────────────────────────────────

    /**
     * POST /reports/generate
     * Request to generate a new report.
     */
    @Data
    public static class GenerateReportRequest {
        private ReportType type;          // gap, coverage, risk, audit, policy, executive
        private ReportFormat format;      // PDF, Excel, Word (default: PDF)
        
        // Optional filters
        private String frameworkCode;     // Filter by specific framework
        private String severity;          // Filter by severity (for gap reports)
        private String startDate;         // Date range start (ISO format)
        private String endDate;           // Date range end (ISO format)
        
        // Optional customization
        private String title;             // Custom report title
        private Boolean includeCharts;    // Include visualizations (default: true)
        private Boolean includeDetails;   // Include detailed tables (default: true)
    }

    /**
     * Response from POST /reports/generate
     * Returns immediately with the report in 'generating' status.
     */
    @Data
    @Builder
    public static class GenerateReportResponse {
        private String reportId;
        private String status;            // generating
        private String message;           // "Report generation started"
        private int estimatedSeconds;     // Estimated time to complete
    }
}
