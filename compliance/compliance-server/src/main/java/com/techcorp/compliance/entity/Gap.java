package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "gaps",
    indexes = {
        @Index(name = "idx_gaps_framework_status", columnList = "framework_id, status"),
        @Index(name = "idx_gaps_severity_status",  columnList = "severity, status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gap {

    // ── Enums ─────────────────────────────────────────────────────────────────

    public enum GapType {
        missing_control, incomplete_evidence, outdated_policy
    }

    public enum GapStatus {
        open, in_progress, resolved, accepted_risk
    }

    // ── Primary key ───────────────────────────────────────────────────────────

    @Id
    @Column(length = 36)
    private String id;

    // ── Relationships ─────────────────────────────────────────────────────────

    /** The specific control that is not covered. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "control_id", nullable = false)
    private Control control;

    /** Denormalized for fast queries by framework — avoids joining through control. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "framework_id", nullable = false)
    private Framework framework;

    /** Optional user the gap is assigned to (BIGINT FK matching users.id). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    // ── Classification ────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "gap_type", nullable = false, length = 30)
    @Builder.Default
    private GapType gapType = GapType.missing_control;

    /** Mirrors control.severity — stored here so gaps can be queried without joining controls. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Control.Severity severity;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GapStatus status = GapStatus.open;

    // ── Content ───────────────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "ai_suggestion", columnDefinition = "TEXT")
    private String aiSuggestion;

    @Column(name = "remediation_notes", columnDefinition = "TEXT")
    private String remediationNotes;

    // ── Assignment & priority ─────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private int priority = 0;

    // ── Timeline ──────────────────────────────────────────────────────────────

    @Column(name = "identified_at", nullable = false)
    private LocalDateTime identifiedAt;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "target_date")
    private LocalDate targetDate;

    // ── Metadata (JSON arrays) ────────────────────────────────────────────────

    @Column(name = "evidence_required", columnDefinition = "JSON")
    private String evidenceRequired;

    @Column(name = "related_documents", columnDefinition = "JSON")
    private String relatedDocuments;

    // ── Audit ─────────────────────────────────────────────────────────────────

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Lifecycle hooks ───────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (id == null)          id           = UUID.randomUUID().toString();
        if (identifiedAt == null) identifiedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
