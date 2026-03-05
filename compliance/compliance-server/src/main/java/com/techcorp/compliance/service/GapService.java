package com.techcorp.compliance.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techcorp.compliance.dto.GapDTOs.*;
import com.techcorp.compliance.entity.Control;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    /**
     * POST /api/v1/gaps/analyze
     * Runs a comprehensive gap analysis:
     * 1. Identifies all controls with is_covered = false
     * 2. Creates new gap records for any that don't have active gaps
     * 3. Returns analysis summary with counts and newly identified gaps
     *
     * This is the backend for the "Run Gap Analysis" button in React.
     */
    @Transactional
    public GapAnalysisResult runAnalysis() {
        log.info("Starting gap analysis...");

        long startTime = System.currentTimeMillis();

        // 1. Find all uncovered controls
        List<Control> uncoveredControls = controlRepo.findByIsCoveredFalse();

        // 2. Track new gaps created
        int newGapsCreated = 0;
        int existingGaps = 0;
        List<Gap> newlyIdentifiedGaps = new ArrayList<>();

        for (Control control : uncoveredControls) {
            // Check if an active gap already exists for this control
            boolean hasActiveGap = gapRepo.existsByControlIdAndStatusNot(
                    control.getId(),
                    GapStatus.resolved);

            if (hasActiveGap) {
                existingGaps++;
                continue;
            }

            // Create new gap
            Gap gap = Gap.builder()
                    .control(control)
                    .framework(control.getFramework())
                    .severity(control.getSeverity())
                    .gapType(Gap.GapType.missing_control)
                    .status(GapStatus.open)
                    .description(buildGapDescription(control))
                    .aiSuggestion(buildAiSuggestion(control))
                    .evidenceRequired(control.getEvidenceRequired())
                    .build();

            gapRepo.save(gap);
            newlyIdentifiedGaps.add(gap);
            newGapsCreated++;

            log.info("Created gap for {}/{} - {}",
                    control.getFramework().getCode(),
                    control.getCode(),
                    control.getTitle());
        }

        // 3. Calculate statistics
        List<Gap> allActiveGaps = gapRepo.findByStatusNot(GapStatus.resolved);

        Map<String, Long> byFramework = allActiveGaps.stream()
                .collect(Collectors.groupingBy(
                        g -> g.getFramework().getCode(),
                        Collectors.counting()));

        Map<String, Long> bySeverity = allActiveGaps.stream()
                .collect(Collectors.groupingBy(
                        g -> g.getSeverity().name(),
                        Collectors.counting()));

        long duration = System.currentTimeMillis() - startTime;

        log.info("Gap analysis completed: {} new gaps created, {} existing, {} total active ({}ms)",
                newGapsCreated, existingGaps, allActiveGaps.size(), duration);

        // 4. Build result
        return GapAnalysisResult.builder()
                .totalControlsScanned(uncoveredControls.size())
                .newGapsCreated(newGapsCreated)
                .existingGaps(existingGaps)
                .totalActiveGaps(allActiveGaps.size())
                .gapsByFramework(byFramework)
                .gapsBySeverity(bySeverity)
                .analysisTimeMs(duration)
                .newGaps(newlyIdentifiedGaps.stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .message(buildAnalysisMessage(newGapsCreated, existingGaps, allActiveGaps.size()))
                .build();
    }

    /**
     * Helper: Generates a descriptive gap description
     */
    private String buildGapDescription(Control control) {
        StringBuilder desc = new StringBuilder();
        desc.append("Control \"").append(control.getTitle()).append("\" is not currently covered. ");

        if (control.getDescription() != null && !control.getDescription().isBlank()) {
            desc.append(control.getDescription());
        }

        return desc.toString().trim();
    }

    /**
     * Helper: Generates AI-powered remediation suggestion
     */
    private String buildAiSuggestion(Control control) {
        if (control.getImplementationGuidance() != null &&
                !control.getImplementationGuidance().isBlank()) {
            return control.getImplementationGuidance();
        }

        // Generic suggestions based on control category
        String category = control.getCategory();
        if (category != null) {
            if (category.contains("Physical")) {
                return "Implement physical security controls including access restrictions, monitoring, and environmental protections. Document procedures and maintain access logs.";
            } else if (category.contains("Technical") || category.contains("Technological")) {
                return "Deploy technical security controls such as access management, encryption, monitoring, and logging. Ensure controls are properly configured and tested.";
            } else if (category.contains("Administrative") || category.contains("Organizational")) {
                return "Establish and document policies and procedures. Ensure management approval, staff training, and regular reviews are conducted.";
            } else if (category.contains("People") || category.contains("Personnel")) {
                return "Implement personnel security measures including background checks, training programs, and access reviews. Document all procedures and maintain records.";
            }
        }

        // Severity-based suggestion
        switch (control.getSeverity()) {
            case CRITICAL:
                return "URGENT: This critical control must be addressed immediately. Review requirements, allocate resources, and implement with priority. Document all steps and evidence.";
            case HIGH:
                return "High priority remediation required. Review control requirements, develop implementation plan, and execute within target timeframe. Maintain comprehensive evidence.";
            case MEDIUM:
                return "Review control requirements and develop remediation plan. Implement controls according to organizational schedule and document evidence of compliance.";
            case LOW:
                return "Review control requirements at next planning cycle. Consider implementation as part of continuous improvement program.";
            default:
                return "Review and implement the control requirements according to the framework specification. Maintain evidence of implementation.";
        }
    }

    /**
     * Helper: Generates human-readable analysis summary message
     */
    private String buildAnalysisMessage(int newGaps, int existing, int total) {
        if (newGaps == 0 && existing == 0) {
            return "✓ Gap analysis complete: No gaps identified. All controls are covered!";
        }

        if (newGaps == 0) {
            return String.format("Gap analysis complete: %d active gap%s (no new gaps identified)",
                    total, total == 1 ? "" : "s");
        }

        if (newGaps == 1) {
            return String.format("Gap analysis complete: 1 new gap identified (%d total active)", total);
        }

        return String.format("Gap analysis complete: %d new gaps identified (%d existing, %d total active)",
                newGaps, existing, total);
    }

}
