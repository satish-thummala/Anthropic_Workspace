package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.AuthDTOs.ApiResponse;
import com.techcorp.compliance.dto.FrameworkDTOs.*;
import com.techcorp.compliance.service.DocumentMappingService;
import com.techcorp.compliance.service.FrameworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/frameworks")
@RequiredArgsConstructor
@Slf4j
public class FrameworkController {

    private final FrameworkService       frameworkService;
    private final DocumentMappingService mappingService;

    // ── GET all frameworks ────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<FrameworkSummary>> getAllFrameworks() {
        return ResponseEntity.ok(frameworkService.getAllSummaries());
    }

    // ── POST /map-all  ────────────────────────────────────────────────────────
    /**
     * Runs the document-to-control mapping engine.
     * Persists isCovered changes to DB and returns:
     *   - documentsProcessed, controlsUpdated, controlsAlreadyCovered
     *   - frameworksAffected  (list of codes)
     *   - updatedFrameworks   (fresh card data — same shape as GET /frameworks)
     *   - message             (human-readable summary)
     */
    @PostMapping("/map-all")
    public ResponseEntity<MappingResult> mapAll() {
        log.info("POST /frameworks/map-all triggered");
        return ResponseEntity.ok(mappingService.mapAll());
    }

    // ── GET single framework detail ───────────────────────────────────────────
    @GetMapping("/{code}")
    public ResponseEntity<FrameworkDetail> getFrameworkDetail(@PathVariable String code) {
        return ResponseEntity.ok(frameworkService.getDetail(code));
    }

    // ── POST create framework ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<FrameworkSummary> createFramework(
            @Valid @RequestBody CreateFrameworkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(frameworkService.create(request));
    }

    // ── PATCH update framework ────────────────────────────────────────────────
    @PatchMapping("/{code}")
    public ResponseEntity<FrameworkSummary> updateFramework(
            @PathVariable String code,
            @RequestBody UpdateFrameworkRequest request) {
        return ResponseEntity.ok(frameworkService.update(code, request));
    }

    // ── GET controls (with optional filters) ──────────────────────────────────
    @GetMapping("/{code}/controls")
    public ResponseEntity<List<ControlResponse>> getControls(
            @PathVariable String code,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isCovered) {
        return ResponseEntity.ok(
                frameworkService.getControls(code, severity, category, isCovered, keyword));
    }

    // ── GET distinct categories ───────────────────────────────────────────────
    @GetMapping("/{code}/controls/categories")
    public ResponseEntity<List<String>> getCategories(@PathVariable String code) {
        return ResponseEntity.ok(frameworkService.getCategories(code));
    }

    // ── GET single control ────────────────────────────────────────────────────
    @GetMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ControlResponse> getControl(
            @PathVariable String code,
            @PathVariable String controlId) {
        return ResponseEntity.ok(frameworkService.getControlById(controlId));
    }

    // ── POST create control ───────────────────────────────────────────────────
    @PostMapping("/{code}/controls")
    public ResponseEntity<ControlResponse> createControl(
            @PathVariable String code,
            @Valid @RequestBody CreateControlRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(frameworkService.createControl(code, request));
    }

    // ── PATCH update control ──────────────────────────────────────────────────
    @PatchMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ControlResponse> updateControl(
            @PathVariable String code,
            @PathVariable String controlId,
            @RequestBody UpdateControlRequest request) {
        return ResponseEntity.ok(frameworkService.updateControl(controlId, request));
    }

    // ── PATCH toggle coverage ─────────────────────────────────────────────────
    @PatchMapping("/{code}/controls/{controlId}/coverage")
    public ResponseEntity<ControlResponse> updateCoverage(
            @PathVariable String code,
            @PathVariable String controlId,
            @RequestBody UpdateCoverageRequest request) {
        return ResponseEntity.ok(
                frameworkService.updateCoverage(controlId, request.isCovered()));
    }

    // ── DELETE control ────────────────────────────────────────────────────────
    @DeleteMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ApiResponse> deleteControl(
            @PathVariable String code,
            @PathVariable String controlId) {
        frameworkService.deleteControl(controlId);
        return ResponseEntity.ok(new ApiResponse(true, "Control deleted successfully"));
    }
}
