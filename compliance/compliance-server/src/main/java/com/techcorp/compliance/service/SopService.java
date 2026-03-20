package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.SopDTOs.*;
import com.techcorp.compliance.entity.*;
import com.techcorp.compliance.entity.SopDocument.Category;
import com.techcorp.compliance.entity.SopTask.Status;
import com.techcorp.compliance.entity.SopTask.TaskType;
import com.techcorp.compliance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SopService {

    private final SopDocumentRepository sopRepo;
    private final SopTaskRepository     taskRepo;
    private final UserRepository        userRepo;

    // ── SOP DOCUMENT CRUD ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SopDocumentResponse> getAllSops(boolean activeOnly) {
        List<SopDocument> docs = activeOnly
                ? sopRepo.findByIsActiveTrueOrderByCreatedAtDesc()
                : sopRepo.findAllByOrderByCreatedAtDesc();
        return docs.stream().map(this::toSopResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SopDocumentResponse getSopById(String id) {
        return toSopResponse(findSop(id));
    }

    @Transactional
    public SopDocumentResponse createSop(CreateSopRequest req) {
        User creator = getCurrentUser();
        SopDocument doc = SopDocument.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .version(req.getVersion() != null ? req.getVersion() : "1.0")
                .category(parseCategory(req.getCategory()))
                .content(req.getContent())
                .frameworkCodes(req.getFrameworkCodes())
                .dueDays(req.getDueDays() > 0 ? req.getDueDays() : 7)
                .requiresApproval(req.isRequiresApproval())
                .createdBy(creator)
                .isActive(true)
                .build();
        doc = sopRepo.save(doc);
        log.info("SOP created: {} by {}", doc.getId(), creator != null ? creator.getEmail() : "system");
        return toSopResponse(doc);
    }

    @Transactional
    public SopDocumentResponse updateSop(String id, UpdateSopRequest req) {
        SopDocument doc = findSop(id);
        if (req.getTitle()         != null) doc.setTitle(req.getTitle());
        if (req.getDescription()   != null) doc.setDescription(req.getDescription());
        if (req.getVersion()       != null) doc.setVersion(req.getVersion());
        if (req.getCategory()      != null) doc.setCategory(parseCategory(req.getCategory()));
        if (req.getContent()       != null) doc.setContent(req.getContent());
        if (req.getFrameworkCodes() != null) doc.setFrameworkCodes(req.getFrameworkCodes());
        if (req.getDueDays()       > 0)     doc.setDueDays(req.getDueDays());
        doc.setRequiresApproval(req.isRequiresApproval());
        doc.setActive(req.isActive());
        return toSopResponse(sopRepo.save(doc));
    }

    @Transactional
    public void deleteSop(String id) {
        sopRepo.delete(findSop(id));
    }

    // ── TASK ASSIGNMENT (compliance manager → employees) ──────────────────────

    @Transactional
    public List<SopTaskResponse> assignTasks(String sopId, AssignTaskRequest req) {
        SopDocument sop   = findSop(sopId);
        User        assigner = getCurrentUser();
        TaskType    type  = parseTaskType(req.getTaskType());
        LocalDate   due   = req.getDueDate() != null
                ? req.getDueDate()
                : LocalDate.now().plusDays(sop.getDueDays());

        List<SopTaskResponse> results = new ArrayList<>();

        for (Long empId : req.getEmployeeIds()) {
            User employee = userRepo.findById(empId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + empId));

            // Skip if already assigned
            if (taskRepo.findBySopIdAndAssignedToId(sopId, empId).isPresent()) {
                log.info("Task already assigned — skipping: sop={} employee={}", sopId, empId);
                continue;
            }

            SopTask task = SopTask.builder()
                    .sop(sop)
                    .assignedTo(employee)
                    .assignedBy(assigner)
                    .taskType(type)
                    .status(Status.pending)
                    .dueDate(due)
                    .build();
            results.add(toTaskResponse(taskRepo.save(task)));
            log.info("Task assigned: sop={} employee={}", sopId, empId);
        }

        return results;
    }

    // ── EMPLOYEE TASK ACTIONS ─────────────────────────────────────────────────

    /** Returns all tasks for the currently logged-in employee */
    @Transactional(readOnly = true)
    public List<SopTaskResponse> getMyTasks() {
        User me = getCurrentUser();
        if (me == null) throw new RuntimeException("Not authenticated");
        // Mark overdue tasks before returning
        markOverdueTasks(me.getId());
        return taskRepo.findByAssignedToId(me.getId())
                .stream().map(t -> toTaskResponse(t, true))
                .collect(Collectors.toList());
    }

    /** Employee acknowledges a task — records timestamp and note */
    @Transactional
    public SopTaskResponse acknowledge(String taskId, AcknowledgeRequest req) {
        SopTask task = findTask(taskId);
        assertTaskOwner(task);

        if (task.getStatus() == Status.acknowledged || task.getStatus() == Status.approved) {
            throw new RuntimeException("Task already completed");
        }

        task.setStatus(Status.acknowledged);
        task.setSignedAt(LocalDateTime.now());
        task.setSignatureNote(req.getNote());
        log.info("Task acknowledged: {} by {}", taskId, task.getAssignedTo().getEmail());
        return toTaskResponse(taskRepo.save(task));
    }

    /** Employee approves or rejects a task (for approval-type tasks) */
    @Transactional
    public SopTaskResponse approve(String taskId, ApproveRequest req) {
        SopTask task = findTask(taskId);
        assertTaskOwner(task);

        if (task.getTaskType() != TaskType.approve) {
            throw new RuntimeException("This task does not require approval");
        }

        task.setStatus(req.isApproved() ? Status.approved : Status.rejected);
        task.setSignedAt(LocalDateTime.now());
        task.setSignatureNote(req.isApproved() ? req.getNote() : null);
        task.setRejectionReason(!req.isApproved() ? req.getNote() : null);

        log.info("Task {}: {} by {}",
                req.isApproved() ? "approved" : "rejected",
                taskId, task.getAssignedTo().getEmail());
        return toTaskResponse(taskRepo.save(task));
    }

    // ── COMPLIANCE MANAGER VIEWS ──────────────────────────────────────────────

    /** All tasks for a specific SOP — compliance manager overview */
    @Transactional(readOnly = true)
    public List<SopTaskResponse> getTasksBySop(String sopId) {
        findSop(sopId); // validates existence
        return taskRepo.findBySopId(sopId)
                .stream().map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    /** All employees with their task counts */
    @Transactional(readOnly = true)
    public List<EmployeeInfo> getEmployees() {
        return userRepo.findAll().stream()
                .filter(u -> "Employee".equalsIgnoreCase(u.getRole()))
                .map(u -> EmployeeInfo.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .avatar(u.getAvatar())
                        .pendingTaskCount(taskRepo.countPendingByEmployee(u.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    /** Summary stats for the SOP management dashboard */
    @Transactional(readOnly = true)
    public SopStats getStats() {
        markOverdueTasksAll();
        long employees = userRepo.findAll().stream()
                .filter(u -> "Employee".equalsIgnoreCase(u.getRole())).count();
        return SopStats.builder()
                .totalSops(sopRepo.count())
                .activeSops(sopRepo.findByIsActiveTrueOrderByCreatedAtDesc().size())
                .totalTasks(taskRepo.count())
                .pendingTasks(taskRepo.countByStatus(Status.pending))
                .acknowledgedTasks(taskRepo.countByStatus(Status.acknowledged)
                        + taskRepo.countByStatus(Status.approved))
                .overdueTasks(taskRepo.countByStatus(Status.overdue))
                .totalEmployees(employees)
                .build();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private SopDocument findSop(String id) {
        return sopRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("SOP not found: " + id));
    }

    private SopTask findTask(String id) {
        return taskRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    private void assertTaskOwner(SopTask task) {
        User me = getCurrentUser();
        if (me == null || !me.getId().equals(task.getAssignedTo().getId())) {
            throw new RuntimeException("You can only act on your own tasks");
        }
    }

    private void markOverdueTasks(Long userId) {
        taskRepo.findByAssignedToId(userId).stream()
                .filter(t -> t.getStatus() == Status.pending
                        && t.getDueDate().isBefore(LocalDate.now()))
                .forEach(t -> {
                    t.setStatus(Status.overdue);
                    taskRepo.save(t);
                });
    }

    private void markOverdueTasksAll() {
        taskRepo.findOverdueTasks(LocalDate.now()).forEach(t -> {
            t.setStatus(Status.overdue);
            taskRepo.save(t);
        });
    }

    private User getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return userRepo.findByEmail(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private Category parseCategory(String s) {
        if (s == null) return Category.other;
        try { return Category.valueOf(s.toLowerCase()); } catch (Exception e) { return Category.other; }
    }

    private TaskType parseTaskType(String s) {
        if (s == null) return TaskType.acknowledge;
        try { return TaskType.valueOf(s.toLowerCase()); } catch (Exception e) { return TaskType.acknowledge; }
    }

    // ── DTO mappers ───────────────────────────────────────────────────────────

    private SopDocumentResponse toSopResponse(SopDocument doc) {
        List<SopTask> tasks = taskRepo.findBySopId(doc.getId());
        long pending      = tasks.stream().filter(t -> t.getStatus() == Status.pending).count();
        long acknowledged = tasks.stream().filter(t ->
                t.getStatus() == Status.acknowledged || t.getStatus() == Status.approved).count();
        long overdue      = tasks.stream().filter(t -> t.getStatus() == Status.overdue).count();

        return SopDocumentResponse.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .version(doc.getVersion())
                .category(doc.getCategory() != null ? doc.getCategory().name() : null)
                .content(doc.getContent())
                .frameworkCodes(doc.getFrameworkCodes())
                .dueDays(doc.getDueDays())
                .requiresApproval(doc.isRequiresApproval())
                .isActive(doc.isActive())
                .createdById(doc.getCreatedBy() != null ? doc.getCreatedBy().getId() : null)
                .createdByName(doc.getCreatedBy() != null ? doc.getCreatedBy().getName() : null)
                .createdAt(doc.getCreatedAt())
                .totalAssigned((int) tasks.size())
                .totalAcknowledged((int) acknowledged)
                .totalPending((int) pending)
                .totalOverdue((int) overdue)
                .build();
    }

    private SopTaskResponse toTaskResponse(SopTask t) {
        return toTaskResponse(t, false);
    }

    private SopTaskResponse toTaskResponse(SopTask t, boolean includeContent) {
        long daysUntil = t.getDueDate() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), t.getDueDate()) : 0;
        boolean isOverdue = t.getDueDate() != null
                && t.getDueDate().isBefore(LocalDate.now())
                && (t.getStatus() == Status.pending || t.getStatus() == Status.overdue);

        SopDocument sop = t.getSop();
        return SopTaskResponse.builder()
                .id(t.getId())
                .sopId(sop.getId())
                .sopTitle(sop.getTitle())
                .sopVersion(sop.getVersion())
                .sopCategory(sop.getCategory() != null ? sop.getCategory().name() : null)
                .sopContent(includeContent ? sop.getContent() : null)
                .requiresApproval(sop.isRequiresApproval())
                .assignedToId(t.getAssignedTo().getId())
                .assignedToName(t.getAssignedTo().getName())
                .assignedToEmail(t.getAssignedTo().getEmail())
                .assignedById(t.getAssignedBy() != null ? t.getAssignedBy().getId() : null)
                .assignedByName(t.getAssignedBy() != null ? t.getAssignedBy().getName() : null)
                .status(t.getStatus().name())
                .taskType(t.getTaskType().name())
                .signedAt(t.getSignedAt())
                .signatureNote(t.getSignatureNote())
                .rejectionReason(t.getRejectionReason())
                .dueDate(t.getDueDate())
                .assignedAt(t.getAssignedAt())
                .isOverdue(isOverdue)
                .daysUntilDue(daysUntil)
                .build();
    }
}
