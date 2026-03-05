package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.entity.Gap.GapStatus;
import com.techcorp.compliance.entity.Control.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GapRepository extends JpaRepository<Gap, String> {

    // ── List queries ──────────────────────────────────────────────────────────

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        ORDER BY
            CASE g.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH'     THEN 2
                WHEN 'MEDIUM'   THEN 3
                WHEN 'LOW'      THEN 4
                ELSE 5
            END ASC,
            g.identifiedAt DESC
        """)
    List<Gap> findAllWithDetails();

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE f.code = :frameworkCode
        ORDER BY
            CASE g.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH'     THEN 2
                WHEN 'MEDIUM'   THEN 3
                WHEN 'LOW'      THEN 4
                ELSE 5
            END ASC,
            g.identifiedAt DESC
        """)
    List<Gap> findByFrameworkCode(@Param("frameworkCode") String frameworkCode);

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE g.status = :status
        ORDER BY
            CASE g.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH'     THEN 2
                WHEN 'MEDIUM'   THEN 3
                WHEN 'LOW'      THEN 4
                ELSE 5
            END ASC,
            g.identifiedAt DESC
        """)
    List<Gap> findByStatus(@Param("status") GapStatus status);

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE g.severity = :severity
        ORDER BY g.identifiedAt DESC
        """)
    List<Gap> findBySeverity(@Param("severity") Severity severity);

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE f.code   = :frameworkCode
          AND g.status = :status
        ORDER BY
            CASE g.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH'     THEN 2
                WHEN 'MEDIUM'   THEN 3
                WHEN 'LOW'      THEN 4
                ELSE 5
            END ASC
        """)
    List<Gap> findByFrameworkCodeAndStatus(
        @Param("frameworkCode") String frameworkCode,
        @Param("status")        GapStatus status);

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE LOWER(c.code)        LIKE LOWER(CONCAT('%', :kw, '%'))
           OR LOWER(c.title)       LIKE LOWER(CONCAT('%', :kw, '%'))
           OR LOWER(g.description) LIKE LOWER(CONCAT('%', :kw, '%'))
        ORDER BY
            CASE g.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH'     THEN 2
                WHEN 'MEDIUM'   THEN 3
                WHEN 'LOW'      THEN 4
                ELSE 5
            END ASC
        """)
    List<Gap> searchByKeyword(@Param("kw") String keyword);

    // ── Single fetch ──────────────────────────────────────────────────────────

    @Query("""
        SELECT g FROM Gap g
        JOIN FETCH g.control c
        JOIN FETCH g.framework f
        LEFT JOIN FETCH g.assignedTo u
        WHERE g.id = :id
        """)
    Optional<Gap> findByIdWithDetails(@Param("id") String id);

    // ── Counts ────────────────────────────────────────────────────────────────

    long countBySeverity(Severity severity);
    long countByStatus(GapStatus status);
    long countBySeverityAndStatusNot(Severity severity, GapStatus excludedStatus);

    // ── Existence check ───────────────────────────────────────────────────────

    boolean existsByControlIdAndStatusNot(String controlId, GapStatus excludedStatus);

    // ── Active gaps for a control ─────────────────────────────────────────────

    @Query("""
        SELECT g FROM Gap g
        WHERE g.control.id = :controlId
          AND g.status <> com.techcorp.compliance.entity.Gap$GapStatus.resolved
          AND g.status <> com.techcorp.compliance.entity.Gap$GapStatus.accepted_risk
        """)
    List<Gap> findActiveByControlId(@Param("controlId") String controlId);
}
