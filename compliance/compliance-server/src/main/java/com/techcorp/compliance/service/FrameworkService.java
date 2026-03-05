package com.techcorp.compliance.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techcorp.compliance.dto.FrameworkDTOs.*;
import com.techcorp.compliance.entity.Control;
import com.techcorp.compliance.entity.Control.Severity;
import com.techcorp.compliance.entity.Framework;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.FrameworkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FrameworkService {

    private final FrameworkRepository frameworkRepo;
    private final ControlRepository   controlRepo;
    private final ObjectMapper         mapper;

    // Injected lazily to avoid circular dependency (GapService → ControlRepo, FrameworkService → GapService)
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.techcorp.compliance.service.GapService gapService;

    // ─────────────────────────────────────────────────────────────────────────
    // FRAMEWORK OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /** All active frameworks as summary cards (React list page). */
    public List<FrameworkSummary> getAllSummaries() {
        return frameworkRepo.findAllActiveOrderByCode()
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    /** Full detail with controls + breakdown stats (React View Details page). */
    public FrameworkDetail getDetail(String code) {
        Framework fw = findByCode(code);
        List<Control> controls = controlRepo.findByFrameworkIdOrderByDisplayOrderAsc(fw.getId());

        return FrameworkDetail.builder()
                .id(fw.getId())
                .code(fw.getCode())
                .name(fw.getName())
                .version(fw.getVersion())
                .description(fw.getDescription())
                .color(fw.getColor())
                .totalControls(fw.getTotalControls())
                .coveredControls(fw.getCoveredControls())
                .coveragePercentage(fw.getCoveragePercentage())
                .industry(fw.getIndustry())
                .publishedDate(fw.getPublishedDate())
                .isActive(fw.isActive())
                .byCategory(buildCategoryStats(controls))
                .bySeverity(buildSeverityStats(controls))
                .controls(controls.stream().map(this::toControlResponse).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public FrameworkSummary create(CreateFrameworkRequest req) {
        if (frameworkRepo.existsByCode(req.getCode().toUpperCase()))
            throw new RuntimeException("Framework code '" + req.getCode() + "' already exists");

        Framework fw = Framework.builder()
                .code(req.getCode().toUpperCase())
                .name(req.getName())
                .version(req.getVersion())
                .description(req.getDescription())
                .color(req.getColor())
                .industry(req.getIndustry())
                .publishedDate(req.getPublishedDate())
                .build();

        frameworkRepo.save(fw);
        log.info("Created framework: {}", fw.getCode());
        return toSummary(fw);
    }

    @Transactional
    public FrameworkSummary update(String code, UpdateFrameworkRequest req) {
        Framework fw = findByCode(code);
        if (req.getName()        != null) fw.setName(req.getName());
        if (req.getVersion()     != null) fw.setVersion(req.getVersion());
        if (req.getDescription() != null) fw.setDescription(req.getDescription());
        if (req.getColor()       != null) fw.setColor(req.getColor());
        if (req.getIndustry()    != null) fw.setIndustry(req.getIndustry());
        if (req.getIsActive()    != null) fw.setActive(req.getIsActive());
        frameworkRepo.save(fw);
        return toSummary(fw);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROL OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /** List controls with optional filters: severity, category, isCovered, keyword. */
    public List<ControlResponse> getControls(String frameworkCode,
                                              String severity, String category,
                                              Boolean isCovered, String keyword) {
        Framework fw = findByCode(frameworkCode);
        List<Control> controls;

        if (keyword != null && !keyword.isBlank()) {
            controls = controlRepo.searchByKeyword(fw.getId(), keyword);
        } else if (severity != null) {
            controls = controlRepo.findByFrameworkIdAndSeverityOrderByDisplayOrderAsc(
                    fw.getId(), Severity.valueOf(severity.toUpperCase()));
        } else if (category != null) {
            controls = controlRepo.findByFrameworkIdAndCategoryOrderByDisplayOrderAsc(
                    fw.getId(), category);
        } else if (isCovered != null) {
            controls = controlRepo.findByFrameworkIdAndIsCoveredOrderByDisplayOrderAsc(
                    fw.getId(), isCovered);
        } else {
            controls = controlRepo.findByFrameworkIdOrderByDisplayOrderAsc(fw.getId());
        }

        return controls.stream().map(this::toControlResponse).collect(Collectors.toList());
    }

    public ControlResponse getControlById(String id) {
        return toControlResponse(findControl(id));
    }

    public List<String> getCategories(String frameworkCode) {
        return controlRepo.findDistinctCategoriesByFrameworkId(findByCode(frameworkCode).getId());
    }

    @Transactional
    public ControlResponse createControl(String frameworkCode, CreateControlRequest req) {
        Framework fw = findByCode(frameworkCode);

        if (controlRepo.existsByFrameworkIdAndCode(fw.getId(), req.getCode()))
            throw new RuntimeException("Control '" + req.getCode() + "' already exists in " + frameworkCode);

        Control c = Control.builder()
                .framework(fw)
                .code(req.getCode())
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory())
                .severity(Severity.valueOf(req.getSeverity().toUpperCase()))
                .implementationGuidance(req.getImplementationGuidance())
                .isCovered(req.isCovered())
                .evidenceRequired(toJson(req.getEvidenceRequired()))
                .displayOrder(req.getDisplayOrder())
                .build();

        controlRepo.save(c);
        refreshStats(fw);
        return toControlResponse(c);
    }

    @Transactional
    public ControlResponse updateControl(String controlId, UpdateControlRequest req) {
        Control c = findControl(controlId);
        if (req.getTitle()                  != null) c.setTitle(req.getTitle());
        if (req.getDescription()            != null) c.setDescription(req.getDescription());
        if (req.getCategory()               != null) c.setCategory(req.getCategory());
        if (req.getSeverity()               != null) c.setSeverity(Severity.valueOf(req.getSeverity().toUpperCase()));
        if (req.getImplementationGuidance() != null) c.setImplementationGuidance(req.getImplementationGuidance());
        if (req.getIsCovered()              != null) c.setCovered(req.getIsCovered());
        if (req.getEvidenceRequired()       != null) c.setEvidenceRequired(toJson(req.getEvidenceRequired()));
        if (req.getDisplayOrder()           != null) c.setDisplayOrder(req.getDisplayOrder());

        controlRepo.save(c);
        refreshStats(c.getFramework());
        return toControlResponse(c);
    }

    /** Single-field PATCH — toggles isCovered on a control (used by the checkbox in the UI). */
    @Transactional
    public ControlResponse updateCoverage(String controlId, boolean isCovered) {
        Control c = findControl(controlId);
        boolean wasCovered = c.isCovered();
        c.setCovered(isCovered);
        controlRepo.save(c);
        refreshStats(c.getFramework());
        log.info("Coverage updated: {} → {}", c.getCode(), isCovered);

        // Sync gap table: resolve gaps when covered, open gap when uncovered
        if (isCovered && !wasCovered) {
            gapService.resolveGapsForControl(controlId);
        } else if (!isCovered && wasCovered) {
            gapService.openGapForControl(controlId);
        }

        return toControlResponse(c);
    }

    @Transactional
    public void deleteControl(String controlId) {
        Control c = findControl(controlId);
        Framework fw = c.getFramework();
        controlRepo.delete(c);
        refreshStats(fw);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAP ALL DOCUMENTS  (Option B — rule-based simulation)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Simulates running all documents against all framework controls.
     *
     * Mapping rules (deterministic, not random):
     *  - Each simulated document covers a realistic set of framework codes
     *  - For each framework a document covers, uncovered controls are marked
     *    covered based on severity:
     *      LOW    → always mark covered
     *      MEDIUM → always mark covered
     *      HIGH   → mark covered if displayOrder is even
     *      CRITICAL → never auto-covered (requires manual review)
     *
     * Can be swapped for real NLP/embedding analysis later without changing
     * the API contract.
     */
    @Transactional
    public MappingResult mapAllDocuments() {
        log.info("Starting document→framework mapping simulation…");

        List<SimDocument> documents = List.of(
            new SimDocument("Information Security Policy",  List.of("ISO27001", "SOC2")),
            new SimDocument("Data Protection Policy",       List.of("GDPR", "ISO27001")),
            new SimDocument("HR Employee Handbook",         List.of("ISO27001")),
            new SimDocument("IT Security Procedures",       List.of("ISO27001", "HIPAA", "SOC2")),
            new SimDocument("Business Continuity Plan",     List.of("SOC2", "ISO27001"))
        );

        Set<String> affectedCodes   = new LinkedHashSet<>();
        int totalUpdated            = 0;
        int totalAlreadyCovered     = 0;

        for (SimDocument doc : documents) {
            log.debug("  Processing: {}", doc.name());
            for (String fwCode : doc.frameworkCodes()) {
                Optional<Framework> fwOpt = frameworkRepo.findByCode(fwCode);
                if (fwOpt.isEmpty()) continue;

                Framework fw = fwOpt.get();
                List<Control> controls = controlRepo.findByFrameworkIdOrderByDisplayOrderAsc(fw.getId());

                for (Control ctrl : controls) {
                    if (ctrl.isCovered()) { totalAlreadyCovered++; continue; }

                    boolean shouldCover = switch (ctrl.getSeverity()) {
                        case LOW      -> true;
                        case MEDIUM   -> true;
                        case HIGH     -> ctrl.getDisplayOrder() != null && ctrl.getDisplayOrder() % 2 == 0;
                        case CRITICAL -> false;
                    };

                    if (shouldCover) {
                        ctrl.setCovered(true);
                        controlRepo.save(ctrl);
                        totalUpdated++;
                        affectedCodes.add(fwCode);
                    }
                }
            }
        }

        // Refresh stats on affected frameworks, collect updated summaries
        List<FrameworkSummary> updatedSummaries = new ArrayList<>();
        for (String code : affectedCodes) {
            frameworkRepo.findByCode(code).ifPresent(fw -> {
                refreshStats(fw);
                updatedSummaries.add(toSummary(fw));
            });
        }
        // Add any untouched frameworks so the frontend gets all 4 cards
        frameworkRepo.findAllActiveOrderByCode().forEach(fw -> {
            if (updatedSummaries.stream().noneMatch(s -> s.getCode().equals(fw.getCode())))
                updatedSummaries.add(toSummary(fw));
        });

        String msg = String.format(
            "Mapped %d documents — %d controls updated across %d framework%s",
            documents.size(), totalUpdated,
            affectedCodes.size(), affectedCodes.size() == 1 ? "" : "s"
        );
        log.info("Mapping complete: {}", msg);

        return MappingResult.builder()
                .documentsProcessed(documents.size())
                .controlsUpdated(totalUpdated)
                .controlsAlreadyCovered(totalAlreadyCovered)
                .frameworksAffected(new ArrayList<>(affectedCodes))
                .updatedFrameworks(updatedSummaries)
                .summary(msg)
                .build();
    }

    private record SimDocument(String name, List<String> frameworkCodes) {}


    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Framework findByCode(String code) {
        return frameworkRepo.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Framework not found: " + code));
    }

    private Control findControl(String id) {
        return controlRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Control not found: " + id));
    }

    /** Recompute totalControls / coveredControls on the parent Framework row. */
    private void refreshStats(Framework fw) {
        fw.setTotalControls((int) controlRepo.countByFrameworkId(fw.getId()));
        fw.setCoveredControls((int) controlRepo.countByFrameworkIdAndIsCoveredTrue(fw.getId()));
        frameworkRepo.save(fw);
    }

    private FrameworkSummary toSummary(Framework fw) {
        return FrameworkSummary.builder()
                .id(fw.getId())
                .code(fw.getCode())
                .name(fw.getName())
                .version(fw.getVersion())
                .description(fw.getDescription())
                .color(fw.getColor())
                .totalControls(fw.getTotalControls())
                .coveredControls(fw.getCoveredControls())
                .coveragePercentage(fw.getCoveragePercentage())
                .industry(fw.getIndustry())
                .isActive(fw.isActive())
                .build();
    }

    private ControlResponse toControlResponse(Control c) {
        return ControlResponse.builder()
                .id(c.getId())
                .frameworkCode(c.getFramework().getCode())
                .code(c.getCode())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .severity(c.getSeverity().name())
                .implementationGuidance(c.getImplementationGuidance())
                .isCovered(c.isCovered())
                .evidenceRequired(fromJson(c.getEvidenceRequired()))
                .displayOrder(c.getDisplayOrder())
                .build();
    }

    private List<CategoryStats> buildCategoryStats(List<Control> controls) {
        return controls.stream()
                .filter(c -> c.getCategory() != null)
                .collect(Collectors.groupingBy(Control::getCategory))
                .entrySet().stream()
                .map(e -> {
                    int total   = e.getValue().size();
                    int covered = (int) e.getValue().stream().filter(Control::isCovered).count();
                    return CategoryStats.builder()
                            .category(e.getKey())
                            .total(total).covered(covered)
                            .coveragePercentage(total == 0 ? 0 : (int) Math.round(covered * 100.0 / total))
                            .build();
                })
                .sorted(Comparator.comparing(CategoryStats::getCategory))
                .collect(Collectors.toList());
    }

    private List<SeverityStats> buildSeverityStats(List<Control> controls) {
        Map<String, List<Control>> bySev = controls.stream()
                .collect(Collectors.groupingBy(c -> c.getSeverity().name()));

        return List.of("CRITICAL", "HIGH", "MEDIUM", "LOW").stream()
                .filter(bySev::containsKey)
                .map(sev -> {
                    List<Control> list = bySev.get(sev);
                    int total   = list.size();
                    int covered = (int) list.stream().filter(Control::isCovered).count();
                    return SeverityStats.builder()
                            .severity(sev).total(total)
                            .covered(covered).gaps(total - covered)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try { return mapper.writeValueAsString(list); } catch (Exception e) { return "[]"; }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return mapper.readValue(json, new TypeReference<>() {}); } catch (Exception e) { return List.of(); }
    }
}
