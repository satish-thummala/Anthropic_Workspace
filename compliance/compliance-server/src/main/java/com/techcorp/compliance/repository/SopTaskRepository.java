package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.SopTask;
import com.techcorp.compliance.entity.SopTask.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SopTaskRepository extends JpaRepository<SopTask, String> {

    // All tasks for a specific employee (for the employee portal)
    @Query("SELECT t FROM SopTask t JOIN FETCH t.sop s WHERE t.assignedTo.id = :userId ORDER BY t.dueDate ASC")
    List<SopTask> findByAssignedToId(@Param("userId") Long userId);

    // All tasks for a specific SOP (for compliance managers)
    @Query("SELECT t FROM SopTask t JOIN FETCH t.assignedTo WHERE t.sop.id = :sopId ORDER BY t.assignedAt DESC")
    List<SopTask> findBySopId(@Param("sopId") String sopId);

    // Check if employee already has a task for a SOP
    Optional<SopTask> findBySopIdAndAssignedToId(String sopId, Long userId);

    // All pending/overdue tasks (for dashboard stats)
    @Query("SELECT t FROM SopTask t WHERE t.status IN ('pending','overdue') ORDER BY t.dueDate ASC")
    List<SopTask> findAllPendingOrOverdue();

    // Tasks overdue (past due date and still pending)
    @Query("SELECT t FROM SopTask t WHERE t.status = 'pending' AND t.dueDate < :today")
    List<SopTask> findOverdueTasks(@Param("today") LocalDate today);

    // Stats for dashboard
    long countByStatus(Status status);

    @Query("SELECT COUNT(t) FROM SopTask t WHERE t.assignedTo.id = :userId AND t.status IN ('pending','overdue')")
    long countPendingByEmployee(@Param("userId") Long userId);
}
