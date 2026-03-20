package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AuditLog — immutable record of every significant user action.
 *
 * Design rules:
 *  - NEVER updated after creation (no @PreUpdate, no setters used after save)
 *  - One row per event — fine-grained, not batched
 *  - Always stores who, what, which entity, when, and outcome
 *  - IP address stored for security investigations
 */
@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_user",       columnList = "user_email"),
        @Index(name = "idx_audit_action",     columnList = "action"),
        @Index(name = "idx_audit_entity",     columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_outcome",    columnList = "outcome")
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    // ── Event category ────────────────────────────────────────────────────────

    public enum Action {
        // Authentication
        USER_LOGIN,
        USER_LOGOUT,
        LOGIN_FAILED,
        TOKEN_REFRESHED,

        // Gap lifecycle
        GAP_STATUS_CHANGED,     // open → in_progress → resolved → accepted_risk
        GAP_ASSIGNED,
        GAP_NOTES_UPDATED,
        GAP_CREATED,            // auto-detected from document analysis
        GAP_ANALYSIS_RUN,

        // Documents
        DOCUMENT_UPLOADED,
        DOCUMENT_DELETED,
        DOCUMENT_ANALYZED,      // Tika re-extraction
        DOCUMENT_GAP_DETECTION, // NLP gap detection run on document

        // Policy
        POLICY_GENERATED,
        POLICY_SAVED_TO_DOCS,

        // Frameworks
        FRAMEWORK_COVERAGE_UPDATED,

        // Reports
        REPORT_GENERATED,

        // Risk
        RISK_RECALCULATED,

        // Incidents
        INCIDENT_CREATED,
        INCIDENT_STATUS_CHANGED,
        INCIDENT_UPDATED,
        INCIDENT_DELETED,
        INCIDENT_REPORT_GENERATED
    }

    public enum Outcome { SUCCESS, FAILURE }

    // ── Fields ────────────────────────────────────────────────────────────────

    @Id
    @Column(length = 36)
    private String id;

    /** Who performed the action — email from JWT */
    @Column(name = "user_email", length = 150)
    private String userEmail;

    /** Display name for the UI */
    @Column(name = "user_name", length = 100)
    private String userName;

    /** What happened */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Action action;

    /** Which type of entity was affected: Gap, Document, Policy, Framework, Report, Auth */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** UUID / ID of the affected entity */
    @Column(name = "entity_id", length = 100)
    private String entityId;

    /** Human-readable name of the entity e.g. "Access Control Policy" */
    @Column(name = "entity_name", length = 500)
    private String entityName;

    /** Short description of what changed e.g. "Status changed: open → resolved" */
    @Column(length = 1000)
    private String description;

    /** Previous value — for update events */
    @Column(name = "old_value", length = 500)
    private String oldValue;

    /** New value — for update events */
    @Column(name = "new_value", length = 500)
    private String newValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Outcome outcome = Outcome.SUCCESS;

    /** Error message when outcome = FAILURE */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /** Client IP address */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Additional context as a short JSON or key=value string */
    @Column(length = 1000)
    private String metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id        == null) id        = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
