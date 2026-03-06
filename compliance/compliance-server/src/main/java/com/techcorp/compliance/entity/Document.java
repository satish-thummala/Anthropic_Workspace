package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "documents",
    indexes = {
        @Index(name = "idx_docs_status",      columnList = "status"),
        @Index(name = "idx_docs_uploaded_at", columnList = "uploaded_at")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    public enum Status { queued, processing, analyzed, error }

    // ── PK ────────────────────────────────────────────────────────────────────
    @Id
    @Column(length = 36)
    private String id;

    // ── File metadata ─────────────────────────────────────────────────────────
    @Column(nullable = false, length = 500)
    private String name;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;                    // PDF | DOCX | XLSX | TXT

    @Column(name = "file_size_bytes", nullable = false)
    @Builder.Default
    private long fileSizeBytes = 0;

    @Column(name = "file_size_label", nullable = false, length = 30)
    @Builder.Default
    private String fileSizeLabel = "";          // e.g. "2.4 MB" — preformatted for UI

    // ── Status & analysis results ─────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.queued;

    @Column(name = "coverage_score")
    private Integer coverageScore;              // null until analyzed, 0-100 after

    // ── Uploader (soft ref — no FK, user deletion must not cascade) ───────────
    @Column(name = "uploaded_by_name", length = 100)
    private String uploadedByName;

    // ── Timestamps ────────────────────────────────────────────────────────────
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Framework codes stored in join table ──────────────────────────────────
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "document_framework_mappings",
        joinColumns = @JoinColumn(name = "document_id")
    )
    @Column(name = "framework_code", length = 50)
    @Builder.Default
    private List<String> frameworkCodes = new ArrayList<>();

    // ── Lifecycle hooks ───────────────────────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        if (id         == null) id         = UUID.randomUUID().toString();
        if (uploadedAt == null) uploadedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
