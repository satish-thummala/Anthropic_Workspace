package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class IncidentDTOs {

    // ── Response ──────────────────────────────────────────────────────────────

    @Data @Builder
    public static class IncidentResponse {
        private String        id;
        private String        title;
        private String        description;
        private String        severity;        // CRITICAL | HIGH | MEDIUM | LOW
        private String        incidentType;    // data_breach | unauthorised_access | ...
        private String        status;          // open | investigating | contained | resolved | closed
        private String        affectedSystems;
        private String        affectedFrameworks;
        private boolean       personalDataInvolved;
        private Integer       recordsAffected;
        private String        rootCause;
        private String        correctiveActions;
        private String        lessonsLearned;
        private String        aiNarrative;
        // People
        private Long          reportedById;
        private String        reportedByName;
        private Long          assignedToId;
        private String        assignedToName;
        // Regulatory
        private boolean       regulatorNotified;
        private LocalDateTime regulatorNotifiedAt;
        private boolean       individualsNotified;
        // Timestamps
        private LocalDateTime detectedAt;
        private LocalDateTime containedAt;
        private LocalDateTime resolvedAt;
        private LocalDateTime closedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ── Create request ────────────────────────────────────────────────────────

    @Data
    public static class CreateIncidentRequest {
        private String  title;                              // required
        private String  description;
        private String  severity;                           // CRITICAL | HIGH | MEDIUM | LOW
        private String  incidentType;                       // data_breach | ...
        private String  affectedSystems;
        private String  affectedFrameworks;
        private boolean personalDataInvolved;
        private Integer recordsAffected;
        private Long    assignedToId;
    }

    // ── Update request ────────────────────────────────────────────────────────

    @Data
    public static class UpdateIncidentRequest {
        private String  title;
        private String  description;
        private String  severity;
        private String  incidentType;
        private String  status;
        private String  affectedSystems;
        private String  affectedFrameworks;
        private boolean personalDataInvolved;
        private Integer recordsAffected;
        private String  rootCause;
        private String  correctiveActions;
        private String  lessonsLearned;
        private Long    assignedToId;
        private boolean regulatorNotified;
        private boolean individualsNotified;
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Data @Builder
    public static class IncidentStats {
        private long total;
        private long active;          // not resolved or closed
        private long critical;        // active + CRITICAL severity
        private long open;
        private long investigating;
        private long contained;
        private long resolved;
        private long closed;
        private long personalDataBreaches;
    }
}
