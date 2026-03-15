package com.techcorp.compliance.service;

import com.techcorp.compliance.entity.*;
import com.techcorp.compliance.repository.*;
import com.techcorp.compliance.service.gapdetection.ControlKeywordsDictionary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GapDetectionService
 *
 * Automatically detects compliance gaps by analyzing document text
 * and matching it against framework control keywords.
 *
 * Workflow:
 * 1. Load document's extracted text
 * 2. Load all controls for detected frameworks
 * 3. For each control, check if keywords appear in text
 * 4. Create gaps for controls NOT mentioned
 * 5. Return analysis results with confidence scores
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GapDetectionService {

    private final DocumentRepository documentRepository;
    private final FrameworkRepository frameworkRepository;
    private final ControlRepository controlRepository;
    private final GapRepository gapRepository;

    /**
     * Analyze a document and auto-detect gaps.
     *
     * @param documentId The document to analyze
     * @return Analysis results
     */
    @Transactional
    public GapAnalysisResult analyzeDocumentForGaps(String documentId) {
        log.info("Starting gap detection for document: {}", documentId);

        // 1. Load document
        var document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        // 2. Validate extracted text exists
        String extractedText = document.getExtractedText();
        if (extractedText == null || extractedText.isBlank()) {
            log.warn("No extracted text for document: {}", documentId);
            return GapAnalysisResult.builder()
                    .documentId(documentId)
                    .documentName(document.getName())
                    .success(false)
                    .message(
                            "No text extracted from document. Please re-upload or click Analyze to extract text first.")
                    .frameworkAnalyses(Collections.emptyList())
                    .build();
        }

        // 3. Parse framework CODES from document (e.g. "ISO27001,GDPR")
        List<String> frameworkCodes = parseFrameworkIds(document.getFrameworkIds());
        if (frameworkCodes.isEmpty()) {
            log.warn("No frameworks detected for document: {}", documentId);
            return GapAnalysisResult.builder()
                    .documentId(documentId)
                    .documentName(document.getName())
                    .success(false)
                    .message(
                            "No compliance frameworks detected in this document. Upload a policy document and allow text extraction to run first.")
                    .frameworkAnalyses(Collections.emptyList())
                    .build();
        }

        log.info("Analyzing document '{}' against frameworks: {}", document.getName(), frameworkCodes);

        // 4. Analyze each framework
        List<FrameworkAnalysis> frameworkAnalyses = new ArrayList<>();
        int totalControlsAnalyzed = 0;
        int totalCovered = 0;
        int totalGapsCreated = 0;

        for (String frameworkCode : frameworkCodes) {
            // ── BUG FIX: frameworkIds stores codes like "ISO27001", not names like
            // "ISO/IEC 27001"
            // Must use findByCode() not findByName().
            Optional<Framework> frameworkOpt = frameworkRepository.findByCode(frameworkCode);
            if (frameworkOpt.isEmpty()) {
                log.warn("Framework code not found in database: '{}' — skipping", frameworkCode);
                continue;
            }

            Framework framework = frameworkOpt.get();
            FrameworkAnalysis analysis = analyzeFramework(document, framework, extractedText);

            frameworkAnalyses.add(analysis);
            totalControlsAnalyzed += analysis.getTotalControls();
            totalCovered += analysis.getCoveredControls();
            totalGapsCreated += analysis.getGapsCreated();
        }

        if (frameworkAnalyses.isEmpty()) {
            return GapAnalysisResult.builder()
                    .documentId(documentId)
                    .documentName(document.getName())
                    .success(false)
                    .message("None of the detected frameworks (" + String.join(", ", frameworkCodes) +
                            ") exist in the database. Ensure DataInitializer has seeded them.")
                    .frameworkAnalyses(Collections.emptyList())
                    .build();
        }

        // 5. Build result
        int coveragePercentage = totalControlsAnalyzed > 0
                ? (totalCovered * 100) / totalControlsAnalyzed
                : 0;

        log.info("Gap detection complete: {} controls analyzed, {} covered, {} gaps created",
                totalControlsAnalyzed, totalCovered, totalGapsCreated);

        return GapAnalysisResult.builder()
                .documentId(documentId)
                .documentName(document.getName())
                .success(true)
                .totalControls(totalControlsAnalyzed)
                .coveredControls(totalCovered)
                .gapsDetected(totalGapsCreated)
                .coveragePercentage(coveragePercentage)
                .frameworkAnalyses(frameworkAnalyses)
                .analyzedAt(LocalDateTime.now())
                .message(String.format(
                        "Analysis complete — %d controls checked across %d framework(s), %d gap(s) created",
                        totalControlsAnalyzed, frameworkAnalyses.size(), totalGapsCreated))
                .build();
    }

    // ── Private: analyze one framework ───────────────────────────────────────

    private FrameworkAnalysis analyzeFramework(
            Document document,
            Framework framework,
            String extractedText) {

        log.info("Analyzing framework: {} ({})", framework.getCode(), framework.getName());

        List<Control> controls = controlRepository.findByFramework(framework);

        if (controls.isEmpty()) {
            log.warn("No controls found for framework: {}", framework.getCode());
            return FrameworkAnalysis.builder()
                    .frameworkId(framework.getId())
                    .frameworkName(framework.getName())
                    .totalControls(0)
                    .coveredControls(0)
                    .gapsCreated(0)
                    .coveragePercentage(0)
                    .controlMatches(Collections.emptyList())
                    .build();
        }

        List<ControlMatch> controlMatches = new ArrayList<>();
        int covered = 0;
        int gapsCreated = 0;
        String textLower = extractedText.toLowerCase();

        for (Control control : controls) {
            ControlMatch match = matchControl(control, textLower, framework);
            controlMatches.add(match);

            if (match.isCovered()) {
                covered++;
            } else {
                boolean created = createGapForControl(document, control, framework, match);
                if (created)
                    gapsCreated++;
            }
        }

        int coveragePercentage = (covered * 100) / controls.size();

        log.info("Framework {} — {}/{} controls covered ({}%), {} gaps created",
                framework.getCode(), covered, controls.size(), coveragePercentage, gapsCreated);

        return FrameworkAnalysis.builder()
                .frameworkId(framework.getId())
                .frameworkName(framework.getName())
                .totalControls(controls.size())
                .coveredControls(covered)
                .gapsCreated(gapsCreated)
                .coveragePercentage(coveragePercentage)
                .controlMatches(controlMatches)
                .build();
    }

    // ── Private: keyword match one control ───────────────────────────────────

    private ControlMatch matchControl(Control control, String textLower, Framework framework) {
        // ControlKeywordsDictionary is keyed by framework CODE (ISO27001, SOC2, GDPR,
        // HIPAA)
        List<String> keywords = ControlKeywordsDictionary.getKeywords(
                framework.getCode(), // use code, not name
                control.getCode());

        if (keywords.isEmpty()) {
            return ControlMatch.builder()
                    .controlId(control.getId())
                    .controlCode(control.getCode())
                    .controlTitle(control.getTitle())
                    .covered(false)
                    .confidence(0)
                    .matchedKeywords(Collections.emptyList())
                    .reason("No keywords defined for control " + control.getCode())
                    .build();
        }

        List<String> matched = new ArrayList<>();
        for (String kw : keywords) {
            if (textLower.contains(kw.toLowerCase())) {
                matched.add(kw);
            }
        }

        int confidence = (matched.size() * 100) / keywords.size();
        boolean covered = confidence >= 30;

        String reason = covered
                ? String.format("Covered — matched %d/%d keywords (%d%%)",
                        matched.size(), keywords.size(), confidence)
                : String.format("Gap — only matched %d/%d keywords (%d%% < 30%% threshold)",
                        matched.size(), keywords.size(), confidence);

        return ControlMatch.builder()
                .controlId(control.getId())
                .controlCode(control.getCode())
                .controlTitle(control.getTitle())
                .covered(covered)
                .confidence(confidence)
                .matchedKeywords(matched)
                .reason(reason)
                .build();
    }

    // ── Private: create gap for uncovered control ─────────────────────────────

    private boolean createGapForControl(
            Document document,
            Control control,
            Framework framework,
            ControlMatch match) {

        // Skip if an active (open / in_progress) gap already exists for this control
        // boolean activeGapExists = gapRepository.findByControlId(control.getId())
        // .stream()
        // .anyMatch(g -> g.getStatus() == Gap.GapStatus.open
        // || g.getStatus() == Gap.GapStatus.in_progress);
        Optional<Gap> existingGaps = gapRepository.findByControlId(control.getId());
        boolean activeGapExists = existingGaps.stream()
                .anyMatch(g -> g.getStatus() == Gap.GapStatus.open
                        || g.getStatus() == Gap.GapStatus.in_progress);

        if (activeGapExists) {
            log.debug("Active gap already exists for control: {}", control.getCode());
            return false;
        }

        Gap gap = Gap.builder()
                .control(control)
                .framework(framework)
                .severity(control.getSeverity())
                .gapType(Gap.GapType.missing_control)
                .status(Gap.GapStatus.open)
                .description(String.format(
                        "Auto-detected: Control %s (%s) is not documented in '%s'.",
                        control.getCode(), control.getTitle(), document.getName()))
                .aiSuggestion(generateSuggestion(control))
                .relatedDocuments(String.format("[\"%s\"]", document.getId()))
                .priority(calculatePriority(control.getSeverity()))
                .build();

        gapRepository.save(gap);
        log.info("Gap created: {} — {}", control.getCode(), control.getTitle());
        return true;
    }

    // ── Private: helpers ──────────────────────────────────────────────────────

    private String generateSuggestion(Control control) {
        String guidance = control.getImplementationGuidance();
        String snippet = (guidance != null && guidance.length() > 200)
                ? guidance.substring(0, 200) + "…"
                : (guidance != null ? guidance : "implement this control");

        return String.format(
                "Add documentation for %s — %s. Guidance: %s",
                control.getCode(), control.getTitle(), snippet);
    }

    private int calculatePriority(Control.Severity severity) {
        return switch (severity) {
            case CRITICAL -> 100;
            case HIGH -> 75;
            case MEDIUM -> 50;
            case LOW -> 25;
        };
    }

    private List<String> parseFrameworkIds(String frameworkIds) {
        if (frameworkIds == null || frameworkIds.isBlank())
            return Collections.emptyList();
        return Arrays.stream(frameworkIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    // ── Result inner classes ──────────────────────────────────────────────────

    @lombok.Data
    @lombok.Builder
    public static class GapAnalysisResult {
        private String documentId;
        private String documentName;
        private boolean success;
        private String message;
        private int totalControls;
        private int coveredControls;
        private int gapsDetected;
        private int coveragePercentage;
        private List<FrameworkAnalysis> frameworkAnalyses;
        private LocalDateTime analyzedAt;
    }

    @lombok.Data
    @lombok.Builder
    public static class FrameworkAnalysis {
        private String frameworkId;
        private String frameworkName;
        private int totalControls;
        private int coveredControls;
        private int gapsCreated;
        private int coveragePercentage;
        private List<ControlMatch> controlMatches;
    }

    @lombok.Data
    @lombok.Builder
    public static class ControlMatch {
        private String controlId;
        private String controlCode;
        private String controlTitle;
        private boolean covered;
        private int confidence;
        private List<String> matchedKeywords;
        private String reason;
    }
}
