package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.GapDetectionDTOs.*;
import com.techcorp.compliance.service.GapDetectionService;
import com.techcorp.compliance.service.GapDetectionService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * GapDetectionController
 * 
 * REST API for automated gap detection from documents.
 * 
 * Endpoints:
 * POST /api/v1/gap-detection/analyze/{documentId} - Analyze document
 * GET /api/v1/gap-detection/status/{documentId} - Check analysis status
 */
@RestController
@RequestMapping("/api/v1/gap-detection")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class GapDetectionController {

    private final GapDetectionService gapDetectionService;

    /**
     * Analyze a document and auto-detect gaps.
     * 
     * POST /api/v1/gap-detection/analyze/{documentId}
     * 
     * @param documentId Document to analyze
     * @return Analysis results with created gaps
     */
    @PostMapping("/analyze/{documentId}")
    public ResponseEntity<AnalyzeDocumentResponse> analyzeDocument(
            @PathVariable String documentId) {
        log.info("API: Analyzing document for gaps: {}", documentId);

        try {
            GapAnalysisResult result = gapDetectionService.analyzeDocumentForGaps(documentId);

            // Convert to DTO
            AnalyzeDocumentResponse response = AnalyzeDocumentResponse.builder()
                    .success(result.isSuccess())
                    .message(result.getMessage())
                    .documentId(result.getDocumentId())
                    .documentName(result.getDocumentName())
                    .summary(AnalysisSummary.builder()
                            .totalControls(result.getTotalControls())
                            .coveredControls(result.getCoveredControls())
                            .gapsDetected(result.getGapsDetected())
                            .coveragePercentage(result.getCoveragePercentage())
                            .build())
                    .frameworks(result.getFrameworkAnalyses().stream()
                            .map(fa -> FrameworkAnalysisDTO.builder()
                                    .frameworkId(fa.getFrameworkId())
                                    .frameworkName(fa.getFrameworkName())
                                    .totalControls(fa.getTotalControls())
                                    .coveredControls(fa.getCoveredControls())
                                    .gapsCreated(fa.getGapsCreated())
                                    .coveragePercentage(fa.getCoveragePercentage())
                                    .controls(fa.getControlMatches().stream()
                                            .map(cm -> ControlMatchDTO.builder()
                                                    .controlId(cm.getControlId())
                                                    .controlCode(cm.getControlCode())
                                                    .controlTitle(cm.getControlTitle())
                                                    .covered(cm.isCovered())
                                                    .confidence(cm.getConfidence())
                                                    .matchedKeywords(cm.getMatchedKeywords())
                                                    .reason(cm.getReason())
                                                    .build())
                                            .toList())
                                    .build())
                            .toList())
                    .analyzedAt(result.getAnalyzedAt())
                    .build();

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Document not found: {}", documentId, e);
            return ResponseEntity.badRequest().body(
                    AnalyzeDocumentResponse.builder()
                            .success(false)
                            .message("Document not found: " + documentId)
                            .build());
        } catch (Exception e) {
            log.error("Failed to analyze document: {}", documentId, e);
            return ResponseEntity.internalServerError().body(
                    AnalyzeDocumentResponse.builder()
                            .success(false)
                            .message("Analysis failed: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get analysis status for a document.
     * (Future: track async analysis jobs)
     * 
     * GET /api/v1/gap-detection/status/{documentId}
     */
    @GetMapping("/status/{documentId}")
    public ResponseEntity<AnalysisStatusResponse> getAnalysisStatus(
            @PathVariable String documentId) {
        // For now, return simple response
        // In future, could track async analysis jobs
        return ResponseEntity.ok(
                AnalysisStatusResponse.builder()
                        .documentId(documentId)
                        .status("READY")
                        .message("Analysis can be triggered")
                        .build());
    }
}
