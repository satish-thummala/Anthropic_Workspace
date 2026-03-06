package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Report;
import com.techcorp.compliance.entity.Report.ReportStatus;
import com.techcorp.compliance.entity.Report.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {

    // ── Find all with details ─────────────────────────────────────────────────
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "ORDER BY r.generatedAt DESC")
    List<Report> findAllWithDetails();

    // ── Find by status ────────────────────────────────────────────────────────
    
    List<Report> findByStatus(ReportStatus status);
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE r.status = :status " +
           "ORDER BY r.generatedAt DESC")
    List<Report> findByStatusWithDetails(@Param("status") ReportStatus status);

    // ── Find by type ──────────────────────────────────────────────────────────
    
    List<Report> findByType(ReportType type);
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE r.type = :type " +
           "ORDER BY r.generatedAt DESC")
    List<Report> findByTypeWithDetails(@Param("type") ReportType type);

    // ── Find by user ──────────────────────────────────────────────────────────
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE r.generatedBy.id = :userId " +
           "ORDER BY r.generatedAt DESC")
    List<Report> findByGeneratedById(@Param("userId") Long userId);

    // ── Find single with details ──────────────────────────────────────────────
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE r.id = :id")
    Optional<Report> findByIdWithDetails(@Param("id") String id);

    // ── Recent reports ────────────────────────────────────────────────────────
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE r.status = 'ready' " +
           "ORDER BY r.generatedAt DESC")
    List<Report> findRecentReports();

    // ── Counts ────────────────────────────────────────────────────────────────
    
    long countByStatus(ReportStatus status);
    
    long countByType(ReportType type);

    // ── Cleanup queries ───────────────────────────────────────────────────────
    
    /**
     * Find old reports for cleanup (older than specified date).
     */
    List<Report> findByGeneratedAtBeforeAndStatus(
        LocalDateTime date, 
        ReportStatus status
    );

    /**
     * Find stuck reports (generating for too long).
     */
    @Query("SELECT r FROM Report r " +
           "WHERE r.status = 'generating' " +
           "AND r.generatedAt < :cutoff")
    List<Report> findStuckReports(@Param("cutoff") LocalDateTime cutoff);

    // ── Search ────────────────────────────────────────────────────────────────
    
    @Query("SELECT r FROM Report r " +
           "LEFT JOIN FETCH r.generatedBy u " +
           "WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.generatedAt DESC")
    List<Report> searchByName(@Param("keyword") String keyword);
}
