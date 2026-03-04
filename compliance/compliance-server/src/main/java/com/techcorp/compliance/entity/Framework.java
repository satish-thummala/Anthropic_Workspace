package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "frameworks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Framework {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;                    // e.g. "ISO27001", "SOC2"

    @Column(nullable = false, length = 255)
    private String name;                    // e.g. "ISO/IEC 27001"

    @Column(nullable = false, length = 50)
    private String version;                 // e.g. "2022"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String color;                   // hex color e.g. "#3B82F6"

    @Column(name = "total_controls", nullable = false)
    @Builder.Default
    private int totalControls = 0;

    @Column(name = "covered_controls", nullable = false)
    @Builder.Default
    private int coveredControls = 0;

    @Column(length = 100)
    private String industry;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "framework", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Control> controls = new ArrayList<>();

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

    public int getCoveragePercentage() {
        if (totalControls == 0) return 0;
        return (int) Math.round((coveredControls * 100.0) / totalControls);
    }
}
