package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable time-series record — one row per Recalculate call.
 * Never updated after insert; new calls append a fresh row.
 */
@Entity
@Table(
    name = "risk_snapshots",
    indexes = @Index(name = "idx_risk_calculated_at", columnList = "calculated_at")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskSnapshot {

    @Id
    @Column(length = 36)
    private String id;

    // ── Score ─────────────────────────────────────────────────────────────────

    @Column(nullable = false)
    private int score;                        // 0–100

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel;                 // LOW | MEDIUM | HIGH | CRITICAL

    @Column(name = "maturity_label", nullable = false, length = 50)
    private String maturityLabel;             // Initial | Developing | Establishing | Established | Optimizing

    // ── Gap counts at snapshot time ───────────────────────────────────────────

    @Column(name = "critical_gaps", nullable = false)
    @Builder.Default
    private int criticalGaps = 0;

    @Column(name = "high_gaps", nullable = false)
    @Builder.Default
    private int highGaps = 0;

    @Column(name = "medium_gaps", nullable = false)
    @Builder.Default
    private int mediumGaps = 0;

    @Column(name = "low_gaps", nullable = false)
    @Builder.Default
    private int lowGaps = 0;

    // ── Coverage snapshot ─────────────────────────────────────────────────────

    @Column(name = "total_controls", nullable = false)
    @Builder.Default
    private int totalControls = 0;

    @Column(name = "covered_controls", nullable = false)
    @Builder.Default
    private int coveredControls = 0;

    @Column(name = "coverage_percentage", nullable = false)
    @Builder.Default
    private int coveragePercentage = 0;

    @Column(name = "frameworks_below_70", nullable = false)
    @Builder.Default
    private int frameworksBelow70 = 0;

    // ── Optional note ─────────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id            == null) id            = UUID.randomUUID().toString();
        if (calculatedAt  == null) calculatedAt  = LocalDateTime.now();
        if (createdAt     == null) createdAt     = LocalDateTime.now();
    }
}
