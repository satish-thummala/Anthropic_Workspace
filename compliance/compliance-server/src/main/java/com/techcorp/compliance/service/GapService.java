package com.techcorp.compliance.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techcorp.compliance.dto.GapDTOs.*;
import com.techcorp.compliance.entity.Control.Severity;
import com.techcorp.compliance.entity.Gap;
import com.techcorp.compliance.entity.Gap.GapStatus;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.GapRepository;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GapService {

    private final GapRepository gapRepo;
    private final ControlRepository controlRepo;
    private final UserRepository userRepo;
    private final ObjectMapper mapper;

    // ── READ ──────────────────────────────────────────────────────────────────

    /**
     * Main list endpoint — supports optional filters via query params.
     * All filters are optional and combinable.
     *
     * Priority of filter application:
     * keyword > framework + status > framework > status > severity > all
     */
    @Transactional(readOnly = true)
    public List<GapResponse> getGaps(String frameworkCode, String status,
            String severity, String keyword) {

        List<Gap> gaps;

        if (keyword != null && !keyword.isBlank()) {
            gaps = gapRepo.searchByKeyword(keyword.trim());
        } else if (frameworkCode != null && status != null) {
            gaps = gapRepo.findByFrameworkCodeAndStatus(
                    frameworkCode.toUpperCase(), parseStatus(status));
        } else if (frameworkCode != null) {
            gaps = gapRepo.findByFrameworkCode(frameworkCode.toUpperCase());
        } else if (status != null) {
            gaps = gapRepo.findByStatus(parseStatus(status));
        } else if (severity != null) {
            gaps = gapRepo.findBySeverity(Severity.valueOf(severity.toUpperCase()));
        } else {
            gaps = gapRepo.findAllWithDetails();
        }

        return gaps.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Single gap by ID (used by detail view or status update confirmation). */
    @Transactional(readOnly = true)
    public GapResponse getById(String id) {
        return toResponse(findGap(id));
    }

    /** Stats summary for the 4 counter cards + per-framework breakdown. */
    @Transactional(readOnly = true)
    public GapStats getStats() {
        List<Gap> all = gapRepo.findAllWithDetails();

        // Per-framework counts
        List<FrameworkGapCount> byFramework = all.stream()
                .collect(Collectors.groupingBy(g -> g.getFramework().getCode()))
                .entrySet().stream()
                .map(e -> {
                    List<Gap> fwGaps = e.getValue();
                    Gap sample = fwGaps.get(0);
                    return FrameworkGapCount.builder()
                            .frameworkCode(sample.getFramework().getCode())
                            .frameworkName(sample.getFramework().getName())
                            .frameworkColor(sample.getFramework().getColor())
                            .total(fwGaps.size())
                            .open((int) fwGaps.stream()
                                    .filter(g -> g.getStatus() == GapStatus.open).count())
                            .critical((int) fwGaps.stream()
                                    .filter(g -> g.getSeverity() == Severity.CRITICAL).count())
                            .build();
                })
                .sorted((a, b) -> b.getTotal() - a.getTotal())
                .collect(Collectors.toList());

        return GapStats.builder()
                .totalOpen(count(all, GapStatus.open))
                .totalInProgress(count(all, GapStatus.in_progress))
                .totalResolved(count(all, GapStatus.resolved))
                .totalAcceptedRisk(count(all, GapStatus.accepted_risk))
                .critical(countSev(all, Severity.CRITICAL))
                .high(countSev(all, Severity.HIGH))
                .medium(countSev(all, Severity.MEDIUM))
                .low(countSev(all, Severity.LOW))
                .byFramework(byFramework)
                .build();
    }

    // ── WRITE ─────────────────────────────────────────────────────────────────

    /**
     * PATCH /gaps/{id}/status
     * Moves a gap through its workflow.
     * Side effects:
     * - in_progress: sets startedAt if not already set
     * - resolved: sets resolvedAt, saves remediationNotes
     * - open: clears startedAt and resolvedAt (re-open)
     */
    @Transactional
    public GapResponse updateStatus(String id, UpdateStatusRequest req) {
        Gap gap = findGap(id);
        GapStatus newStatus = parseStatus(req.getStatus());

        gap.setStatus(newStatus);

        switch (newStatus) {
            case in_progress -> {
                if (gap.getStartedAt() == null)
                    gap.setStartedAt(LocalDateTime.now());
            }
            case resolved -> {
                gap.setResolvedAt(LocalDateTime.now());
                if (req.getRemediationNotes() != null)
                    gap.setRemediationNotes(req.getRemediationNotes());
            }
            case open -> {
                // Re-opening — clear progress timestamps
                gap.setStartedAt(null);
                gap.setResolvedAt(null);
            }
            case accepted_risk -> {
                if (req.getRemediationNotes() != null)
                    gap.setRemediationNotes(req.getRemediationNotes());
            }
        }

        gapRepo.save(gap);
        log.info("Gap {} status → {}", gap.getId(), newStatus);
        return toResponse(gap);
    }

    /**
     * PATCH /gaps/{id}/assign
     * Assigns the gap to a user and optionally sets a target date.
     * Pass assignedToId = null to un-assign.
     */
    @Transactional
    public GapResponse assign(String id, AssignGapRequest req) {
        Gap gap = findGap(id);

        if (req.getAssignedToId() != null) {
            User user = userRepo.findById(req.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + req.getAssignedToId()));
            gap.setAssignedTo(user);
            gap.setAssignedAt(LocalDateTime.now());
        } else {
            gap.setAssignedTo(null);
            gap.setAssignedAt(null);
        }

        if (req.getTargetDate() != null && !req.getTargetDate().isBlank()) {
            gap.setTargetDate(LocalDate.parse(req.getTargetDate()));
        }

        gapRepo.save(gap);
        log.info("Gap {} assigned to userId={}", gap.getId(), req.getAssignedToId());
        return toResponse(gap);
    }

    /**
     * PATCH /gaps/{id}/notes
     * Saves remediation notes without changing status.
     */
    @Transactional
    public GapResponse updateNotes(String id, UpdateNotesRequest req) {
        Gap gap = findGap(id);
        gap.setRemediationNotes(req.getRemediationNotes());
        gapRepo.save(gap);
        return toResponse(gap);
    }

    // ── INTERNAL: called by FrameworkService.updateCoverage() ─────────────────

    /**
     * Called when a control is toggled to COVERED via the Frameworks page.
     * Resolves all open/in-progress gaps for that control.
     * This is the Java-side equivalent of the DB trigger — ensures consistency
     * whether the change comes via the API or directly in MySQL.
     */
    @Transactional
    public void resolveGapsForControl(String controlId) {
        List<Gap> active = gapRepo.findActiveByControlId(controlId);
        if (active.isEmpty())
            return;

        active.forEach(g -> {
            g.setStatus(GapStatus.resolved);
            g.setResolvedAt(LocalDateTime.now());
        });
        gapRepo.saveAll(active);
        log.info("Resolved {} gap(s) for controlId={}", active.size(), controlId);
    }

    /**
     * Called when a control is toggled to UNCOVERED.
     * Creates a new gap if one doesn't already exist.
     */
    @Transactional
    public void openGapForControl(String controlId) {
        // Don't duplicate if an active gap already exists
        if (gapRepo.existsByControlIdAndStatusNot(controlId, GapStatus.resolved))
            return;

        var control = controlRepo.findById(controlId)
                .orElseThrow(() -> new RuntimeException("Control not found: " + controlId));

        Gap gap = Gap.builder()
                .control(control)
                .framework(control.getFramework())
                .severity(control.getSeverity())
                .gapType(Gap.GapType.missing_control)
                .status(GapStatus.open)
                .description("Control \"" + control.getTitle() + "\" coverage was removed.")
                .aiSuggestion(control.getImplementationGuidance() != null
                        ? control.getImplementationGuidance()
                        : "Review and implement the control requirements.")
                .evidenceRequired(control.getEvidenceRequired())
                .build();

        gapRepo.save(gap);
        log.info("Opened gap for control {}/{}", control.getFramework().getCode(), control.getCode());
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private Gap findGap(String id) {
        return gapRepo.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Gap not found: " + id));
    }

    private GapStatus parseStatus(String s) {
        try {
            return GapStatus.valueOf(s.toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid gap status: " + s +
                    ". Valid values: open, in_progress, resolved, accepted_risk");
        }
    }

    private int count(List<Gap> gaps, GapStatus status) {
        return (int) gaps.stream().filter(g -> g.getStatus() == status).count();
    }

    private int countSev(List<Gap> gaps, Severity sev) {
        return (int) gaps.stream()
                .filter(g -> g.getSeverity() == sev && g.getStatus() != GapStatus.resolved)
                .count();
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank())
            return List.of();
        try {
            return mapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    /** Maps a Gap entity → GapResponse DTO. */
    private GapResponse toResponse(Gap g) {
        return GapResponse.builder()
                // Control
                .controlId(g.getControl().getId())
                .controlCode(g.getControl().getCode())
                .controlTitle(g.getControl().getTitle())
                .controlCategory(g.getControl().getCategory())
                // Framework
                .frameworkId(g.getFramework().getId())
                .frameworkCode(g.getFramework().getCode())
                .frameworkName(g.getFramework().getName())
                .frameworkColor(g.getFramework().getColor())
                // Gap core
                .id(g.getId())
                .gapType(g.getGapType().name())
                .severity(g.getSeverity().name())
                .status(g.getStatus().name())
                .description(g.getDescription())
                .aiSuggestion(g.getAiSuggestion())
                .remediationNotes(g.getRemediationNotes())
                .priority(g.getPriority())
                // Assignment
                .assignedToId(g.getAssignedTo() != null ? g.getAssignedTo().getId() : null)
                .assignedToName(g.getAssignedTo() != null ? g.getAssignedTo().getName() : null)
                .assignedToEmail(g.getAssignedTo() != null ? g.getAssignedTo().getEmail() : null)
                // Timeline
                .identifiedAt(g.getIdentifiedAt())
                .assignedAt(g.getAssignedAt())
                .startedAt(g.getStartedAt())
                .resolvedAt(g.getResolvedAt())
                .targetDate(g.getTargetDate())
                // Metadata
                .evidenceRequired(fromJson(g.getEvidenceRequired()))
                .build();
    }
}
