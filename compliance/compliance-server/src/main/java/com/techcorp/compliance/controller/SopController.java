package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.SopDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.SopService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SopController
 *
 * Two groups of endpoints:
 *
 * COMPLIANCE MANAGER (any authenticated non-employee):
 *   GET    /api/v1/sops                         — list all SOPs
 *   GET    /api/v1/sops/stats                   — dashboard stats
 *   GET    /api/v1/sops/employees               — list employees with task counts
 *   POST   /api/v1/sops                         — create SOP
 *   PUT    /api/v1/sops/{id}                    — update SOP
 *   DELETE /api/v1/sops/{id}                    — delete SOP
 *   GET    /api/v1/sops/{id}/tasks              — all tasks for a SOP
 *   POST   /api/v1/sops/{id}/assign             — assign SOP to employees
 *
 * EMPLOYEE:
 *   GET    /api/v1/sops/my-tasks                — employee's own pending tasks
 *   POST   /api/v1/sops/tasks/{taskId}/acknowledge  — acknowledge a task
 *   POST   /api/v1/sops/tasks/{taskId}/approve       — approve/reject a task
 */
@RestController
@RequestMapping("/api/v1/sops")
@RequiredArgsConstructor
@Slf4j
public class SopController {

    private final SopService   sopService;
    private final AuditService auditService;

    // ── SOP DOCUMENT MANAGEMENT ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<SopDocumentResponse>> getAll(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(sopService.getAllSops(activeOnly));
    }

    @GetMapping("/stats")
    public ResponseEntity<SopStats> getStats() {
        return ResponseEntity.ok(sopService.getStats());
    }

    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeInfo>> getEmployees() {
        return ResponseEntity.ok(sopService.getEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SopDocumentResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(sopService.getSopById(id));
    }

    @PostMapping
    public ResponseEntity<SopDocumentResponse> create(
            @RequestBody CreateSopRequest request) {
        log.info("POST /sops title={}", request.getTitle());
        SopDocumentResponse created = sopService.createSop(request);
        try {
            auditService.log(Action.SOP_CREATED, "SopDocument", created.getId(),
                    created.getTitle(), "SOP document created: " + created.getTitle());
        } catch (Exception e) {
            log.warn("Audit log failed for SOP_CREATED: {}", e.getMessage());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SopDocumentResponse> update(
            @PathVariable String id,
            @RequestBody UpdateSopRequest request) {
        log.info("PUT /sops/{}", id);
        SopDocumentResponse updated = sopService.updateSop(id, request);
        try {
            auditService.log(Action.SOP_UPDATED, "SopDocument", id,
                    updated.getTitle(), "SOP document updated");
        } catch (Exception e) {
            log.warn("Audit log failed for SOP_UPDATED: {}", e.getMessage());
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("DELETE /sops/{}", id);
        SopDocumentResponse sop = sopService.getSopById(id);
        sopService.deleteSop(id);
        try {
            auditService.log(Action.SOP_DELETED, "SopDocument", id,
                    sop.getTitle(), "SOP document deleted");
        } catch (Exception e) {
            log.warn("Audit log failed for SOP_DELETED: {}", e.getMessage());
        }
        return ResponseEntity.noContent().build();
    }

    // ── TASK ASSIGNMENT (manager → employees) ─────────────────────────────────

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<SopTaskResponse>> getTasksBySop(@PathVariable String id) {
        return ResponseEntity.ok(sopService.getTasksBySop(id));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<List<SopTaskResponse>> assign(
            @PathVariable String id,
            @RequestBody AssignTaskRequest request) {
        log.info("POST /sops/{}/assign employees={}", id, request.getEmployeeIds());
        List<SopTaskResponse> tasks = sopService.assignTasks(id, request);
        try {
            auditService.log(Action.SOP_TASK_ASSIGNED, "SopDocument", id,
                    id, "SOP assigned to " + tasks.size() + " employee(s)");
        } catch (Exception e) {
            log.warn("Audit log failed for SOP_TASK_ASSIGNED: {}", e.getMessage());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(tasks);
    }

    // ── EMPLOYEE TASK ACTIONS ─────────────────────────────────────────────────

    @GetMapping("/my-tasks")
    public ResponseEntity<List<SopTaskResponse>> getMyTasks() {
        return ResponseEntity.ok(sopService.getMyTasks());
    }

    @PostMapping("/tasks/{taskId}/acknowledge")
    public ResponseEntity<SopTaskResponse> acknowledge(
            @PathVariable String taskId,
            @RequestBody(required = false) AcknowledgeRequest request) {
        log.info("POST /sops/tasks/{}/acknowledge", taskId);
        if (request == null) request = new AcknowledgeRequest();
        SopTaskResponse updated = sopService.acknowledge(taskId, request);
        try {
            auditService.log(Action.SOP_TASK_ACKNOWLEDGED, "SopTask", taskId,
                    updated.getSopTitle(),
                    "Employee acknowledged SOP: " + updated.getSopTitle());
        } catch (Exception e) {
            log.warn("Audit log failed for SOP_TASK_ACKNOWLEDGED: {}", e.getMessage());
        }
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/tasks/{taskId}/approve")
    public ResponseEntity<SopTaskResponse> approve(
            @PathVariable String taskId,
            @RequestBody ApproveRequest request) {
        log.info("POST /sops/tasks/{}/approve approved={}", taskId, request.isApproved());
        SopTaskResponse updated = sopService.approve(taskId, request);
        Action action = request.isApproved()
                ? Action.SOP_TASK_APPROVED
                : Action.SOP_TASK_REJECTED;
        try {
            auditService.log(action, "SopTask", taskId,
                    updated.getSopTitle(),
                    (request.isApproved() ? "Approved" : "Rejected")
                    + " SOP: " + updated.getSopTitle());
        } catch (Exception e) {
            log.warn("Audit log failed for {}: {}", action, e.getMessage());
        }
        return ResponseEntity.ok(updated);
    }
}
