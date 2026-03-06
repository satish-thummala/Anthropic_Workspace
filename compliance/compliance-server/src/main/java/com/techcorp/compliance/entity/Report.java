package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportFormat format;

    @Column(length = 1000)
    private String filePath;

    @Column
    private Long fileSizeBytes;

    @Column(length = 20)
    private String fileSizeLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private User generatedBy;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(columnDefinition = "JSON")
    private String contentSummary;

    @Column(columnDefinition = "JSON")
    private String parameters;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ────────────────────────────────────────────────────────────────────────
    // ENUMS
    // ────────────────────────────────────────────────────────────────────────

    public enum ReportType {
        gap,        // Gap Analysis Report
        coverage,   // Coverage Report
        risk,       // Risk Assessment
        audit,      // Audit Trail
        policy,     // Policy Update Summary
        executive   // Executive Summary
    }

    public enum ReportFormat {
        PDF,
        Excel,
        Word
    }

    public enum ReportStatus {
        generating,  // Currently being generated
        ready,       // Available for download
        failed       // Generation failed
    }
}
