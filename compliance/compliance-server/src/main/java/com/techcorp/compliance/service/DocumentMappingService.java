package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.FrameworkDTOs.FrameworkSummary;
import com.techcorp.compliance.dto.FrameworkDTOs.MappingResult;
import com.techcorp.compliance.entity.Control;
import com.techcorp.compliance.entity.Framework;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.FrameworkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Option-B simulated document-to-control mapping.
 *
 * Each mock document carries a keyword list.  We score each control by how many
 * of ITS own keywords (extracted from title + category + evidenceRequired) appear
 * in the document's keyword set.  Controls that reach the threshold are marked
 * isCovered = true and persisted.  Framework coverage counters are refreshed
 * at the end so the frontend cards update immediately.
 *
 * When real document storage + text extraction exists, only this service changes —
 * the API contract and React code stay identical.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentMappingService {

    private final ControlRepository   controlRepo;
    private final FrameworkRepository frameworkRepo;
    private final FrameworkService    frameworkService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.techcorp.compliance.service.GapService gapService;

    // ── Minimum fraction of control keywords that must match a document ────────
    private static final double THRESHOLD = 0.25;

    // ── Mock documents — mirror the 5 entries in frontend mockData.ts ─────────
    private static final List<MockDoc> DOCUMENTS = List.of(

        new MockDoc("Information Security Policy", "DOCX", Set.of(
            "security", "policy", "information", "access", "roles",
            "responsibilities", "segregation", "authentication", "privileged",
            "endpoint", "awareness", "training", "disciplinary", "screening",
            "organizational", "procedures")),

        new MockDoc("Data Protection Policy", "PDF", Set.of(
            "data", "protection", "privacy", "gdpr", "processing", "lawfulness",
            "erasure", "access", "breach", "notification", "impact", "assessment",
            "encryption", "personal", "consent", "processor", "records", "integrity")),

        new MockDoc("IT Security Procedures", "DOCX", Set.of(
            "technical", "vulnerability", "patch", "access", "audit", "logging",
            "monitoring", "authentication", "mfa", "firewall", "encryption",
            "transmission", "endpoint", "source", "code", "privileged", "security",
            "technological", "controls", "leakage", "prevention")),

        new MockDoc("HR Employee Handbook", "PDF", Set.of(
            "screening", "employment", "terms", "conditions", "awareness",
            "training", "disciplinary", "workforce", "personnel", "people",
            "integrity", "ethics", "board", "oversight")),

        new MockDoc("Business Continuity Plan", "PDF", Set.of(
            "continuity", "availability", "disaster", "recovery", "backup",
            "resilience", "incident", "rto", "rpo", "planning", "processing"))
    );

    // ── Common stop-words ignored when tokenising control text ────────────────
    private static final Set<String> STOPS = Set.of(
        "and", "the", "for", "with", "that", "this", "from", "have",
        "been", "will", "shall", "must", "also", "into", "such", "they",
        "their", "which", "when", "where", "related", "based", "used", "its"
    );

    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public MappingResult mapAll() {

        List<Control>   controls  = controlRepo.findAll();
        List<Framework> frameworks = frameworkRepo.findAll();

        int newlyCovered   = 0;
        int alreadyCovered = 0;
        Set<String> affected = new LinkedHashSet<>();

        for (Control ctrl : controls) {
            Set<String> ctrlKeys = controlKeywords(ctrl);
            boolean shouldCover  = false;

            for (MockDoc doc : DOCUMENTS) {
                double score = score(doc.keywords(), ctrlKeys);
                if (score >= THRESHOLD) {
                    shouldCover = true;
                    break;           // one matching document is enough
                }
            }

            if (shouldCover) {
                if (!ctrl.isCovered()) {
                    ctrl.setCovered(true);
                    controlRepo.save(ctrl);
                    newlyCovered++;
                    // Resolve any open gaps for this control — keeps gap table in sync
                    gapService.resolveGapsForControl(ctrl.getId());
                    log.debug("Covered: {}/{}", ctrl.getFramework().getCode(), ctrl.getCode());
                } else {
                    alreadyCovered++;
                }
                affected.add(ctrl.getFramework().getCode());
            }
        }

        // Refresh framework-level counters
        for (Framework fw : frameworks) {
            fw.setTotalControls((int)  controlRepo.countByFrameworkId(fw.getId()));
            fw.setCoveredControls((int) controlRepo.countByFrameworkIdAndIsCoveredTrue(fw.getId()));
            frameworkRepo.save(fw);
        }

        List<FrameworkSummary> summaries = frameworkService.getAllSummaries();

        String msg = newlyCovered > 0
            ? String.format("Mapping complete — %d controls newly covered across %d framework%s (%d already covered)",
                newlyCovered, affected.size(), affected.size() == 1 ? "" : "s", alreadyCovered)
            : String.format("All controls already fully mapped (%d covered)", alreadyCovered);

        log.info(msg);

        return MappingResult.builder()
                .documentsProcessed(DOCUMENTS.size())
                .controlsUpdated(newlyCovered)
                .controlsAlreadyCovered(alreadyCovered)
                .frameworksAffected(new ArrayList<>(affected))
                .updatedFrameworks(summaries)
                .message(msg)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Score = how many of the control's keywords appear in the doc's keyword set. */
    private double score(Set<String> docKeys, Set<String> ctrlKeys) {
        if (ctrlKeys.isEmpty()) return 0.0;
        long hits = ctrlKeys.stream().filter(docKeys::contains).count();
        return (double) hits / ctrlKeys.size();
    }

    /** Build a keyword set from a control's title + category + evidenceRequired. */
    private Set<String> controlKeywords(Control c) {
        Set<String> kw = new LinkedHashSet<>();
        tokenise(c.getTitle(),    kw);
        tokenise(c.getCategory(), kw);
        if (c.getEvidenceRequired() != null) {
            // Strip JSON brackets/quotes and tokenise each item
            String raw = c.getEvidenceRequired().replaceAll("[\\[\\]\"]", "");
            for (String part : raw.split(",")) tokenise(part.trim(), kw);
        }
        return kw;
    }

    private void tokenise(String text, Set<String> out) {
        if (text == null || text.isBlank()) return;
        for (String tok : text.toLowerCase().split("[\\s\\-—/&().,]+")) {
            if (tok.length() > 2 && !STOPS.contains(tok)) out.add(tok);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private record MockDoc(String name, String type, Set<String> keywords) {}
}
