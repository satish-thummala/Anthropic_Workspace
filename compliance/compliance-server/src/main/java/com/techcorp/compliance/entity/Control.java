package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "controls",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_framework_control_code",
        columnNames = {"framework_id", "code"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Control {

    public enum Severity {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "framework_id", nullable = false)
    private Framework framework;

    @Column(nullable = false, length = 100)
    private String code;                        // e.g. "A.5.1", "CC1.1", "Art.5"

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String category;                    // e.g. "Organizational Controls"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    @Column(name = "implementation_guidance", columnDefinition = "TEXT")
    private String implementationGuidance;

    @Column(name = "is_covered", nullable = false)
    @Builder.Default
    private boolean isCovered = false;

    // Stored as a JSON array string: ["Policy Doc","Audit Logs"]
    @Column(name = "evidence_required", columnDefinition = "JSON")
    private String evidenceRequired;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
