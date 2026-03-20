package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Incident;
import com.techcorp.compliance.entity.Incident.Status;
import com.techcorp.compliance.entity.Incident.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

    List<Incident> findAllByOrderByCreatedAtDesc();

    List<Incident> findByStatusOrderByCreatedAtDesc(Status status);

    List<Incident> findBySeverityOrderByCreatedAtDesc(Severity severity);

    @Query("""
            SELECT i FROM Incident i
            WHERE (:status   IS NULL OR i.status   = :status)
              AND (:severity IS NULL OR i.severity = :severity)
            ORDER BY i.createdAt DESC
            """)
    List<Incident> findFiltered(
            @Param("status")   Status status,
            @Param("severity") Severity severity);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status NOT IN ('resolved','closed')")
    long countActive();

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.severity = 'CRITICAL' AND i.status NOT IN ('resolved','closed')")
    long countActiveCritical();

    List<Incident> findByPersonalDataInvolvedTrueOrderByCreatedAtDesc();
}
