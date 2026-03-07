package com.techcorp.compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notif_user_read",  columnList = "user_id, is_read"),
        @Index(name = "idx_notif_created_at", columnList = "created_at")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    public enum NotifType {
        CRITICAL_GAP, HIGH_GAP, RISK_CHANGE, FRAMEWORK, SYSTEM
    }

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotifType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Frontend page id to navigate to on click — e.g. "gaps", "risk" */
    @Column(name = "link_page", length = 50)
    private String linkPage;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id        == null) id        = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
