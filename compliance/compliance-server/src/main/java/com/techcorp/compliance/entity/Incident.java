package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Incident — tracks security and compliance incidents from detection to closure.
 *
 * Lifecycle: open → investigating → contained → resolved → closed
 */
@Entity
@Table(
    name = "incidents",
    indexes = {
        @Index(name = "idx_incident_status",   columnList = "status"),
        @Index(name = "idx_incident_severity",  columnList = "severity"),
        @Index(name = "idx_incident_type",      columnList = "incident_type"),
        @Index(name = "idx_incident_created",   columnList = "created_at")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Incident {

    // ── Enums ─────────────────────────────────────────────────────────────────

    public enum Status {
        open,           // Detected, not yet investigated
        investigating,  // Under active investigation
        contained,      // Spread stopped, root cause being addressed
        resolved,       // Root cause fixed, monitoring in place
        closed          // All actions complete, post-incident review done
    }

    public enum Severity {
        CRITICAL,  // Major breach, data exfiltration, ransomware
        HIGH,      // Confirmed unauthorised access, significant disruption
        MEDIUM,    // Suspicious activity, minor policy violation
        LOW        // Near-miss, minor, no data impact
    }

    public enum IncidentType {
        data_breach,           // Personal or sensitive data exposed
        unauthorised_access,   // System accessed without permission
        malware,               // Malicious software detected
        phishing,              // Social engineering attack
        policy_violation,      // Employee violated security policy
        system_outage,         // Availability incident
        third_party_breach,    // Vendor or supplier incident
        insider_threat,        // Internal actor
        other                  // Catch-all
    }

    // ── Primary key ───────────────────────────────────────────────────────────

    @Id
    @Column(length = 36)
    private String id;

    // ── Classification ────────────────────────────────────────────────────────

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Severity severity = Severity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false, length = 30)
    @Builder.Default
    private IncidentType incidentType = IncidentType.other;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.open;

    // ── Impact ────────────────────────────────────────────────────────────────

    /** Comma-separated list of affected systems / applications */
    @Column(name = "affected_systems", length = 1000)
    private String affectedSystems;

    /** Frameworks affected: ISO27001, SOC2, GDPR, HIPAA */
    @Column(name = "affected_frameworks", length = 200)
    private String affectedFrameworks;

    /** True if personal data was involved (triggers GDPR/HIPAA notification) */
    @Column(name = "personal_data_involved", nullable = false)
    @Builder.Default
    private boolean personalDataInvolved = false;

    /** Estimated number of records / individuals affected */
    @Column(name = "records_affected")
    private Integer recordsAffected;

    // ── Investigation ─────────────────────────────────────────────────────────

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "corrective_actions", columnDefinition = "TEXT")
    private String correctiveActions;

    @Column(name = "lessons_learned", columnDefinition = "TEXT")
    private String lessonsLearned;

    /** AI-generated incident narrative (Groq) */
    @Column(name = "ai_narrative", columnDefinition = "TEXT")
    private String aiNarrative;

    // ── People ────────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    // ── Regulatory notification tracking ─────────────────────────────────────

    /** Was the supervisory authority notified? (GDPR Art.33 / HIPAA) */
    @Column(name = "regulator_notified", nullable = false)
    @Builder.Default
    private boolean regulatorNotified = false;

    @Column(name = "regulator_notified_at")
    private LocalDateTime regulatorNotifiedAt;

    /** Were affected individuals notified? */
    @Column(name = "individuals_notified", nullable = false)
    @Builder.Default
    private boolean individualsNotified = false;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;      // When the incident was first detected

    @Column(name = "contained_at")
    private LocalDateTime containedAt;     // When spread was stopped

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;      // When root cause was fixed

    @Column(name = "closed_at")
    private LocalDateTime closedAt;        // When post-incident review was done

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (id == null)        id        = UUID.randomUUID().toString();
        if (detectedAt == null) detectedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
