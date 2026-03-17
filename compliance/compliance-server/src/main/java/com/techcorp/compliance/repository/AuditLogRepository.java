package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.AuditLog;
import com.techcorp.compliance.entity.AuditLog.Action;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    // ── Paginated queries for the UI ──────────────────────────────────────────

    /** All logs newest-first — main audit trail view */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Filter by user */
    Page<AuditLog> findByUserEmailOrderByCreatedAtDesc(String email, Pageable pageable);

    /** Filter by action type */
    Page<AuditLog> findByActionOrderByCreatedAtDesc(Action action, Pageable pageable);

    /** Filter by entity type (Gap, Document, Policy...) */
    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    /** All events for a specific entity — e.g. full history of one gap */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType, String entityId);

    // ── Date range ────────────────────────────────────────────────────────────

    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    // ── Combined filter ───────────────────────────────────────────────────────

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:userEmail IS NULL OR a.userEmail = :userEmail)
              AND (:action     IS NULL OR a.action    = :action)
              AND (:entityType IS NULL OR a.entityType = :entityType)
              AND (:from       IS NULL OR a.createdAt >= :from)
              AND (:to         IS NULL OR a.createdAt <= :to)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findFiltered(
            @Param("userEmail")  String userEmail,
            @Param("action")     Action action,
            @Param("entityType") String entityType,
            @Param("from")       LocalDateTime from,
            @Param("to")         LocalDateTime to,
            Pageable pageable);

    // ── Stats ─────────────────────────────────────────────────────────────────

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT a.userEmail) FROM AuditLog a WHERE a.createdAt >= :since")
    long countActiveUsersSince(@Param("since") LocalDateTime since);
}
