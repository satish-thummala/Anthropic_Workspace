package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for Gap Detection API
 */
public class GapDetectionDTOs {

    @Data
    @Builder
    public static class AnalyzeDocumentResponse {
        private boolean success;
        private String message;

        private String documentId;
        private String documentName;

        private AnalysisSummary summary;
        private List<FrameworkAnalysisDTO> frameworks;

        private LocalDateTime analyzedAt;
    }

    @Data
    @Builder
    public static class AnalysisSummary {
        private int totalControls;
        private int coveredControls;
        private int gapsDetected;
        private int coveragePercentage;
    }

    @Data
    @Builder
    public static class FrameworkAnalysisDTO {
        private String frameworkId;
        private String frameworkName;

        private int totalControls;
        private int coveredControls;
        private int gapsCreated;
        private int coveragePercentage;

        private List<ControlMatchDTO> controls;
    }

    @Data
    @Builder
    public static class ControlMatchDTO {
        private String controlId;
        private String controlCode;
        private String controlTitle;

        private boolean covered;
        private int confidence;

        private List<String> matchedKeywords;
        private String reason;
    }

    @Data
    @Builder
    public static class AnalysisStatusResponse {
        private String documentId;
        private String status; // READY, ANALYZING, COMPLETED, FAILED
        private String message;
    }
}
