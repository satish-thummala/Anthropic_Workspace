package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.IncidentDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * IncidentController
 *
 * Endpoints:
 *   GET    /api/v1/incidents              — list all (with optional filters)
 *   GET    /api/v1/incidents/stats        — summary counts
 *   GET    /api/v1/incidents/{id}         — single incident
 *   POST   /api/v1/incidents              — create new incident
 *   PUT    /api/v1/incidents/{id}         — update incident
 *   DELETE /api/v1/incidents/{id}         — delete incident
 */
@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Slf4j
public class IncidentController {

    private final IncidentService incidentService;
    private final AuditService    auditService;

    @GetMapping
    public ResponseEntity<List<IncidentResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity) {
        return ResponseEntity.ok(incidentService.getAll(status, severity));
    }

    @GetMapping("/stats")
    public ResponseEntity<IncidentStats> getStats() {
        return ResponseEntity.ok(incidentService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> create(
            @RequestBody CreateIncidentRequest request) {
        log.info("POST /incidents title={} severity={}", request.getTitle(), request.getSeverity());
        IncidentResponse created = incidentService.create(request);
        try {
            auditService.log(Action.INCIDENT_CREATED, "Incident", created.getId(),
                    created.getTitle(),
                    "Incident reported: " + created.getTitle()
                    + " [" + created.getSeverity() + "]");
        } catch (Exception auditEx) {
            log.warn("Audit log failed for INCIDENT_CREATED: {}", auditEx.getMessage());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentResponse> update(
            @PathVariable String id,
            @RequestBody UpdateIncidentRequest request) {
        log.info("PUT /incidents/{} status={}", id, request.getStatus());
        IncidentResponse before  = incidentService.getById(id);
        IncidentResponse updated = incidentService.update(id, request);

        // Log status change if it changed
        try {
            if (request.getStatus() != null
                    && !request.getStatus().equals(before.getStatus())) {
                auditService.logChange(Action.INCIDENT_STATUS_CHANGED, "Incident", id,
                        updated.getTitle(),
                        "Status changed: " + before.getStatus() + " → " + updated.getStatus(),
                        before.getStatus(), updated.getStatus());
            } else {
                auditService.log(Action.INCIDENT_UPDATED, "Incident", id,
                        updated.getTitle(), "Incident details updated");
            }
        } catch (Exception auditEx) {
            log.warn("Audit log failed for INCIDENT_UPDATED: {}", auditEx.getMessage());
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("DELETE /incidents/{}", id);
        IncidentResponse incident = incidentService.getById(id);
        incidentService.delete(id);
        try {
            auditService.log(Action.INCIDENT_DELETED, "Incident", id,
                    incident.getTitle(), "Incident deleted");
        } catch (Exception auditEx) {
            log.warn("Audit log failed for INCIDENT_DELETED: {}", auditEx.getMessage());
        }
        return ResponseEntity.noContent().build();
    }
}
