package com.techcorp.compliance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

public class FrameworkDTOs {

    // ── FRAMEWORK RESPONSES ───────────────────────────────────────────────────

    @Data @Builder
    public static class FrameworkSummary {
        private String  id;
        private String  code;
        private String  name;
        private String  version;
        private String  description;
        private String  color;
        private int     totalControls;
        private int     coveredControls;
        private int     coveragePercentage;
        private String  industry;
        private boolean isActive;
    }

    @Data @Builder
    public static class FrameworkDetail {
        private String    id;
        private String    code;
        private String    name;
        private String    version;
        private String    description;
        private String    color;
        private int       totalControls;
        private int       coveredControls;
        private int       coveragePercentage;
        private String    industry;
        private LocalDate publishedDate;
        private boolean   isActive;

        private List<CategoryStats>   byCategory;
        private List<SeverityStats>   bySeverity;
        private List<ControlResponse> controls;
    }

    @Data @Builder
    public static class CategoryStats {
        private String category;
        private int    total;
        private int    covered;
        private int    coveragePercentage;
    }

    @Data @Builder
    public static class SeverityStats {
        private String severity;
        private int    total;
        private int    covered;
        private int    gaps;
    }

    // ── CONTROL RESPONSE ──────────────────────────────────────────────────────

    @Data @Builder
    public static class ControlResponse {
        private String       id;
        private String       frameworkCode;
        private String       code;
        private String       title;
        private String       description;
        private String       category;
        private String       severity;
        private String       implementationGuidance;
        private boolean      isCovered;
        private List<String> evidenceRequired;
        private Integer      displayOrder;
    }

    // ── FRAMEWORK REQUESTS ────────────────────────────────────────────────────

    @Data
    public static class CreateFrameworkRequest {
        @NotBlank(message = "Code is required") @Size(max = 50)
        private String code;
        @NotBlank(message = "Name is required") @Size(max = 255)
        private String name;
        @NotBlank(message = "Version is required")
        private String    version;
        private String    description;
        @NotBlank(message = "Color is required")
        private String    color;
        private String    industry;
        private LocalDate publishedDate;
    }

    @Data
    public static class UpdateFrameworkRequest {
        private String  name;
        private String  version;
        private String  description;
        private String  color;
        private String  industry;
        private Boolean isActive;
    }

    // ── CONTROL REQUESTS ──────────────────────────────────────────────────────

    @Data
    public static class CreateControlRequest {
        @NotBlank(message = "Control code is required")
        private String code;
        @NotBlank(message = "Title is required") @Size(max = 500)
        private String       title;
        private String       description;
        private String       category;
        @NotBlank(message = "Severity is required")
        private String       severity;
        private String       implementationGuidance;
        private boolean      isCovered;
        private List<String> evidenceRequired;
        private Integer      displayOrder;
    }

    @Data
    public static class UpdateControlRequest {
        private String       title;
        private String       description;
        private String       category;
        private String       severity;
        private String       implementationGuidance;
        private Boolean      isCovered;
        private List<String> evidenceRequired;
        private Integer      displayOrder;
    }

    @Data
    public static class UpdateCoverageRequest {
        private boolean isCovered;
    }

    // ── MAPPING RESULT  (POST /api/v1/frameworks/map-all) ─────────────────────

    @Data @Builder
    public static class MappingResult {
        private int                  documentsProcessed;
        private int                  controlsUpdated;
        private int                  controlsAlreadyCovered;
        private List<String>         frameworksAffected;
        private List<FrameworkSummary> updatedFrameworks;
        private String               message;
    }
}
