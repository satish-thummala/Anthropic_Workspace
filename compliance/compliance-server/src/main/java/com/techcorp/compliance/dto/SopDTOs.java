package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SopDTOs {

    // ── SOP Document responses ────────────────────────────────────────────────

    @Data @Builder
    public static class SopDocumentResponse {
        private String        id;
        private String        title;
        private String        description;
        private String        version;
        private String        category;
        private String        content;
        private String        frameworkCodes;
        private int           dueDays;
        private boolean       requiresApproval;
        private boolean       isActive;
        private Long          createdById;
        private String        createdByName;
        private LocalDateTime createdAt;
        // Aggregated task stats (for compliance manager view)
        private int           totalAssigned;
        private int           totalAcknowledged;
        private int           totalPending;
        private int           totalOverdue;
    }

    @Data
    public static class CreateSopRequest {
        private String  title;          // required
        private String  description;
        private String  version;
        private String  category;
        private String  content;        // Markdown policy text
        private String  frameworkCodes;
        private int     dueDays;
        private boolean requiresApproval;
    }

    @Data
    public static class UpdateSopRequest {
        private String  title;
        private String  description;
        private String  version;
        private String  category;
        private String  content;
        private String  frameworkCodes;
        private int     dueDays;
        private boolean requiresApproval;
        private boolean isActive;
    }

    // ── Task assignment ───────────────────────────────────────────────────────

    @Data
    public static class AssignTaskRequest {
        private List<Long> employeeIds;  // assign to multiple employees at once
        private String     taskType;     // acknowledge | approve | complete_training
        private LocalDate  dueDate;      // override default due date
    }

    // ── Task responses ────────────────────────────────────────────────────────

    @Data @Builder
    public static class SopTaskResponse {
        private String        id;
        private String        sopId;
        private String        sopTitle;
        private String        sopVersion;
        private String        sopCategory;
        private String        sopContent;  // only sent to the assigned employee
        private boolean       requiresApproval;
        // Employee
        private Long          assignedToId;
        private String        assignedToName;
        private String        assignedToEmail;
        private Long          assignedById;
        private String        assignedByName;
        // Status
        private String        status;
        private String        taskType;
        private LocalDateTime signedAt;
        private String        signatureNote;
        private String        rejectionReason;
        // Dates
        private LocalDate     dueDate;
        private LocalDateTime assignedAt;
        // Derived
        private boolean       isOverdue;
        private long          daysUntilDue;
    }

    // ── Action requests ───────────────────────────────────────────────────────

    @Data
    public static class AcknowledgeRequest {
        private String note;  // optional note from employee
    }

    @Data
    public static class ApproveRequest {
        private boolean approved;  // true = approve, false = reject
        private String  note;      // required if rejected
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Data @Builder
    public static class SopStats {
        private long totalSops;
        private long activeSops;
        private long totalTasks;
        private long pendingTasks;
        private long acknowledgedTasks;
        private long overdueTasks;
        private long totalEmployees;
    }

    // ── Employee list (for assigning tasks) ───────────────────────────────────

    @Data @Builder
    public static class EmployeeInfo {
        private Long   id;
        private String name;
        private String email;
        private String avatar;
        private long   pendingTaskCount;
    }
}
