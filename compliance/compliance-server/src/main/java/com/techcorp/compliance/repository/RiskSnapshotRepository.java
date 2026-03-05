package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.RiskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskSnapshotRepository extends JpaRepository<RiskSnapshot, String> {

    /** Most recent snapshot — used for the current score display. */
    Optional<RiskSnapshot> findTopByOrderByCalculatedAtDesc();

    /**
     * All snapshots ordered oldest→newest — used for the trend chart.
     * Returns at most 24 points so the chart never gets unwieldy.
     */
    @Query("""
        SELECT r FROM RiskSnapshot r
        ORDER BY r.calculatedAt ASC
        LIMIT 24
        """)
    List<RiskSnapshot> findAllForTrend();

    /**
     * Last N snapshots for a compact trend chart (newest first, caller reverses).
     * Used by the Dashboard mini-chart which only needs 7 points.
     */
    @Query("""
        SELECT r FROM RiskSnapshot r
        ORDER BY r.calculatedAt DESC
        LIMIT :n
        """)
    List<RiskSnapshot> findLatestN(int n);
}
