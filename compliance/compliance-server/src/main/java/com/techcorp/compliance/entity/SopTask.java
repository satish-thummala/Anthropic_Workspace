package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "sop_tasks",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_task_employee_sop",
        columnNames = {"sop_id", "assigned_to_id"}
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SopTask {

    public enum Status {
        pending,        // Assigned, not yet acted on
        acknowledged,   // Employee confirmed they read it
        approved,       // Employee approved (for approval-type tasks)
        rejected,       // Employee rejected (with reason)
        overdue         // Past due date without action
    }

    public enum TaskType {
        acknowledge,        // Read and confirm
        approve,            // Review and formally approve/reject
        complete_training   // Mark a training module as done
    }

    @Id @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sop_id", nullable = false)
    private SopDocument sop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.pending;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 20)
    @Builder.Default
    private TaskType taskType = TaskType.acknowledge;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "signature_note", columnDefinition = "TEXT")
    private String signatureNote;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (assignedAt == null) assignedAt = LocalDateTime.now();
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
