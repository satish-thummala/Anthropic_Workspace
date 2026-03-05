package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Control;
import com.techcorp.compliance.entity.Control.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ControlRepository extends JpaRepository<Control, String> {

    // All controls for a framework, ordered
    List<Control> findByFrameworkIdOrderByDisplayOrderAsc(String frameworkId);

    // Filter by severity
    List<Control> findByFrameworkIdAndSeverityOrderByDisplayOrderAsc(String frameworkId, Severity severity);

    // Filter by category
    List<Control> findByFrameworkIdAndCategoryOrderByDisplayOrderAsc(String frameworkId, String category);

    // Filter by covered status
    List<Control> findByFrameworkIdAndIsCoveredOrderByDisplayOrderAsc(String frameworkId, boolean isCovered);

    // Counts for stats refresh
    long countByFrameworkId(String frameworkId);
    long countByFrameworkIdAndIsCoveredTrue(String frameworkId);
    long countByFrameworkIdAndIsCoveredFalseAndSeverity(String frameworkId, Severity severity);

    // Duplicate check
    boolean existsByFrameworkIdAndCode(String frameworkId, String code);

    // Distinct categories for filter dropdown
    @Query("SELECT DISTINCT c.category FROM Control c WHERE c.framework.id = :frameworkId ORDER BY c.category")
    List<String> findDistinctCategoriesByFrameworkId(@Param("frameworkId") String frameworkId);

    // Keyword search across code, title, description
    @Query("""
        SELECT c FROM Control c
        WHERE c.framework.id = :frameworkId
          AND (LOWER(c.code)        LIKE LOWER(CONCAT('%', :kw, '%'))
            OR LOWER(c.title)       LIKE LOWER(CONCAT('%', :kw, '%'))
            OR LOWER(c.description) LIKE LOWER(CONCAT('%', :kw, '%')))
        ORDER BY c.displayOrder ASC
        """)
    List<Control> searchByKeyword(@Param("frameworkId") String frameworkId, @Param("kw") String kw);

    // ────────────────────────────────────────────────────────────────────────────
    // ADDED FOR GAP ANALYSIS
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * Find all controls that are NOT covered.
     * Used by gap analysis to identify potential gaps.
     */
    List<Control> findByIsCoveredFalse();

    /**
     * Find all controls that ARE covered.
     * Useful for coverage reports.
     */
    List<Control> findByIsCoveredTrue();

    /**
     * Count uncovered controls across all frameworks.
     * Quick check before running analysis.
     */
    long countByIsCoveredFalse();

    /**
     * Find uncovered controls for a specific framework.
     * For framework-specific gap analysis.
     */
    @Query("SELECT c FROM Control c WHERE c.isCovered = false AND c.framework.id = :frameworkId")
    List<Control> findUncoveredByFrameworkId(@Param("frameworkId") String frameworkId);
}
