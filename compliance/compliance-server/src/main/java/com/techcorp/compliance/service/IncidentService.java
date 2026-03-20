package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.IncidentDTOs.*;
import com.techcorp.compliance.entity.Incident;
import com.techcorp.compliance.entity.Incident.Severity;
import com.techcorp.compliance.entity.Incident.Status;
import com.techcorp.compliance.entity.Incident.IncidentType;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.IncidentRepository;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepo;
    private final UserRepository     userRepo;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<IncidentResponse> getAll(String status, String severity) {
        Status   s = parseStatus(status);
        Severity v = parseSeverity(severity);

        List<Incident> incidents = (s == null && v == null)
                ? incidentRepo.findAllByOrderByCreatedAtDesc()
                : incidentRepo.findFiltered(s, v);

        return incidents.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncidentResponse getById(String id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public IncidentStats getStats() {
        List<Incident> all = incidentRepo.findAllByOrderByCreatedAtDesc();
        return IncidentStats.builder()
                .total(all.size())
                .active(incidentRepo.countActive())
                .critical(incidentRepo.countActiveCritical())
                .open(         count(all, Status.open))
                .investigating(count(all, Status.investigating))
                .contained(    count(all, Status.contained))
                .resolved(     count(all, Status.resolved))
                .closed(       count(all, Status.closed))
                .personalDataBreaches(all.stream().filter(Incident::isPersonalDataInvolved).count())
                .build();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse create(CreateIncidentRequest req) {
        User reporter = getCurrentUser();
        User assignee = req.getAssignedToId() != null
                ? userRepo.findById(req.getAssignedToId()).orElse(null) : null;

        Incident incident = Incident.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .severity(parseSeverity(req.getSeverity()) != null
                        ? parseSeverity(req.getSeverity()) : Severity.MEDIUM)
                .incidentType(parseType(req.getIncidentType()) != null
                        ? parseType(req.getIncidentType()) : IncidentType.other)
                .status(Status.open)
                .affectedSystems(req.getAffectedSystems())
                .affectedFrameworks(req.getAffectedFrameworks())
                .personalDataInvolved(req.isPersonalDataInvolved())
                .recordsAffected(req.getRecordsAffected())
                .reportedBy(reporter)
                .assignedTo(assignee)
                .build();

        incident = incidentRepo.save(incident);
        log.info("Incident created: {} [{}]", incident.getId(), incident.getSeverity());
        return toResponse(incident);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse update(String id, UpdateIncidentRequest req) {
        Incident incident = find(id);
        Status oldStatus  = incident.getStatus();

        if (req.getTitle()             != null) incident.setTitle(req.getTitle());
        if (req.getDescription()       != null) incident.setDescription(req.getDescription());
        if (req.getSeverity()          != null && parseSeverity(req.getSeverity()) != null)
            incident.setSeverity(parseSeverity(req.getSeverity()));
        if (req.getIncidentType()      != null && parseType(req.getIncidentType()) != null)
            incident.setIncidentType(parseType(req.getIncidentType()));
        if (req.getAffectedSystems()   != null) incident.setAffectedSystems(req.getAffectedSystems());
        if (req.getAffectedFrameworks() != null) incident.setAffectedFrameworks(req.getAffectedFrameworks());
        if (req.getRootCause()         != null) incident.setRootCause(req.getRootCause());
        if (req.getCorrectiveActions() != null) incident.setCorrectiveActions(req.getCorrectiveActions());
        if (req.getLessonsLearned()    != null) incident.setLessonsLearned(req.getLessonsLearned());
        incident.setPersonalDataInvolved(req.isPersonalDataInvolved());
        if (req.getRecordsAffected()   != null) incident.setRecordsAffected(req.getRecordsAffected());

        // Regulatory notifications
        if (req.isRegulatorNotified() && !incident.isRegulatorNotified()) {
            incident.setRegulatorNotified(true);
            incident.setRegulatorNotifiedAt(LocalDateTime.now());
        }
        incident.setIndividualsNotified(req.isIndividualsNotified());

        // Assignee
        if (req.getAssignedToId() != null) {
            userRepo.findById(req.getAssignedToId()).ifPresent(incident::setAssignedTo);
        }

        // Status transition with timestamp recording
        if (req.getStatus() != null && parseStatus(req.getStatus()) != null) {
            Status newStatus = parseStatus(req.getStatus());
            incident.setStatus(newStatus);

            if (newStatus == Status.contained  && incident.getContainedAt() == null)
                incident.setContainedAt(LocalDateTime.now());
            if (newStatus == Status.resolved   && incident.getResolvedAt() == null)
                incident.setResolvedAt(LocalDateTime.now());
            if (newStatus == Status.closed     && incident.getClosedAt() == null)
                incident.setClosedAt(LocalDateTime.now());
        }

        incident = incidentRepo.save(incident);
        log.info("Incident updated: {} status={}", id, incident.getStatus());
        return toResponse(incident);
    }

    // ── AI narrative ──────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse saveAiNarrative(String id, String narrative) {
        Incident incident = find(id);
        incident.setAiNarrative(narrative);
        return toResponse(incidentRepo.save(incident));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String id) {
        incidentRepo.delete(find(id));
        log.info("Incident deleted: {}", id);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Incident find(String id) {
        return incidentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + id));
    }

    private long count(List<Incident> incidents, Status status) {
        return incidents.stream().filter(i -> i.getStatus() == status).count();
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

    private Status parseStatus(String s) {
        if (s == null) return null;
        try { return Status.valueOf(s.toLowerCase()); } catch (Exception e) { return null; }
    }

    private Severity parseSeverity(String s) {
        if (s == null) return null;
        try { return Severity.valueOf(s.toUpperCase()); } catch (Exception e) { return null; }
    }

    private IncidentType parseType(String s) {
        if (s == null) return null;
        try { return IncidentType.valueOf(s.toLowerCase()); } catch (Exception e) { return null; }
    }

    // ── DTO mapper ────────────────────────────────────────────────────────────

    public IncidentResponse toResponse(Incident i) {
        return IncidentResponse.builder()
                .id(i.getId())
                .title(i.getTitle())
                .description(i.getDescription())
                .severity(i.getSeverity() != null ? i.getSeverity().name() : null)
                .incidentType(i.getIncidentType() != null ? i.getIncidentType().name() : null)
                .status(i.getStatus() != null ? i.getStatus().name() : null)
                .affectedSystems(i.getAffectedSystems())
                .affectedFrameworks(i.getAffectedFrameworks())
                .personalDataInvolved(i.isPersonalDataInvolved())
                .recordsAffected(i.getRecordsAffected())
                .rootCause(i.getRootCause())
                .correctiveActions(i.getCorrectiveActions())
                .lessonsLearned(i.getLessonsLearned())
                .aiNarrative(i.getAiNarrative())
                .reportedById(i.getReportedBy() != null ? i.getReportedBy().getId() : null)
                .reportedByName(i.getReportedBy() != null ? i.getReportedBy().getName() : null)
                .assignedToId(i.getAssignedTo() != null ? i.getAssignedTo().getId() : null)
                .assignedToName(i.getAssignedTo() != null ? i.getAssignedTo().getName() : null)
                .regulatorNotified(i.isRegulatorNotified())
                .regulatorNotifiedAt(i.getRegulatorNotifiedAt())
                .individualsNotified(i.isIndividualsNotified())
                .detectedAt(i.getDetectedAt())
                .containedAt(i.getContainedAt())
                .resolvedAt(i.getResolvedAt())
                .closedAt(i.getClosedAt())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
