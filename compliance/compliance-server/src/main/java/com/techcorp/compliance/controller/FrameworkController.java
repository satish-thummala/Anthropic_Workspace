package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.AuthDTOs.ApiResponse;
import com.techcorp.compliance.dto.FrameworkDTOs.*;
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

    private final FrameworkService frameworkService;

    // ─────────────────────────────────────────────────────────────────────────
    // FRAMEWORK ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/frameworks
     * Returns all active frameworks as summary cards.
     * ← React: Frameworks list page (the 4 cards)
     *
     * Response example:
     * [
     *   {
     *     "id": "uuid", "code": "ISO27001", "name": "ISO/IEC 27001",
     *     "version": "2022", "color": "#3B82F6",
     *     "totalControls": 17, "coveredControls": 12, "coveragePercentage": 71,
     *     "industry": "Technology", "isActive": true
     *   }, ...
     * ]
     */
    @GetMapping
    public ResponseEntity<List<FrameworkSummary>> getAllFrameworks() {
        return ResponseEntity.ok(frameworkService.getAllSummaries());
    }

    /**
     * GET /api/v1/frameworks/{code}
     * Returns full framework detail with controls and breakdown stats.
     * ← React: "View Details →" button on each framework card
     *
     * @param code  e.g. ISO27001 | SOC2 | GDPR | HIPAA  (case-insensitive)
     */
    @GetMapping("/{code}")
    public ResponseEntity<FrameworkDetail> getFrameworkDetail(@PathVariable String code) {
        return ResponseEntity.ok(frameworkService.getDetail(code));
    }

    /**
     * POST /api/v1/frameworks
     * Creates a new compliance framework.
     *
     * Request body:
     * { "code":"PCI_DSS", "name":"PCI DSS", "version":"4.0",
     *   "description":"...", "color":"#EF4444", "industry":"Finance" }
     */
    @PostMapping
    public ResponseEntity<FrameworkSummary> createFramework(
            @Valid @RequestBody CreateFrameworkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(frameworkService.create(request));
    }

    /**
     * PATCH /api/v1/frameworks/{code}
     * Partially updates a framework (name, color, active status, etc.).
     */
    @PatchMapping("/{code}")
    public ResponseEntity<FrameworkSummary> updateFramework(
            @PathVariable String code,
            @RequestBody UpdateFrameworkRequest request) {
        return ResponseEntity.ok(frameworkService.update(code, request));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROL ENDPOINTS  (nested under /frameworks/{code}/controls)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/frameworks/{code}/controls
     * Returns controls for a framework with optional query filters.
     * ← React: controls table inside View Details page
     *
     * Query params (all optional, mutually exclusive — first match wins):
     *   ?keyword=encryption          full-text search on code/title/description
     *   ?severity=CRITICAL           CRITICAL | HIGH | MEDIUM | LOW
     *   ?category=Organizational+Controls
     *   ?isCovered=false             true | false
     */
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

    /**
     * GET /api/v1/frameworks/{code}/controls/categories
     * Distinct category list for the filter dropdown.
     */
    @GetMapping("/{code}/controls/categories")
    public ResponseEntity<List<String>> getCategories(@PathVariable String code) {
        return ResponseEntity.ok(frameworkService.getCategories(code));
    }

    /**
     * GET /api/v1/frameworks/{code}/controls/{controlId}
     * Single control by UUID.
     */
    @GetMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ControlResponse> getControl(
            @PathVariable String code,
            @PathVariable String controlId) {
        return ResponseEntity.ok(frameworkService.getControlById(controlId));
    }

    /**
     * POST /api/v1/frameworks/{code}/controls
     * Adds a new control to a framework.
     *
     * Request body:
     * {
     *   "code": "A.12.6.1",
     *   "title": "Vulnerability Management",
     *   "category": "Technological Controls",
     *   "severity": "CRITICAL",
     *   "isCovered": false,
     *   "evidenceRequired": ["Scan Reports","Patch Records"],
     *   "displayOrder": 20
     * }
     */
    @PostMapping("/{code}/controls")
    public ResponseEntity<ControlResponse> createControl(
            @PathVariable String code,
            @Valid @RequestBody CreateControlRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(frameworkService.createControl(code, request));
    }

    /**
     * PATCH /api/v1/frameworks/{code}/controls/{controlId}
     * Partial update of any control field.
     */
    @PatchMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ControlResponse> updateControl(
            @PathVariable String code,
            @PathVariable String controlId,
            @RequestBody UpdateControlRequest request) {
        return ResponseEntity.ok(frameworkService.updateControl(controlId, request));
    }

    /**
     * PATCH /api/v1/frameworks/{code}/controls/{controlId}/coverage
     * Toggle the covered status of a single control.
     * ← React: coverage checkbox in the View Details controls table
     *
     * Request body:  { "isCovered": true }
     * Response:      updated ControlResponse
     */
    @PatchMapping("/{code}/controls/{controlId}/coverage")
    public ResponseEntity<ControlResponse> updateCoverage(
            @PathVariable String code,
            @PathVariable String controlId,
            @RequestBody UpdateCoverageRequest request) {
        return ResponseEntity.ok(
                frameworkService.updateCoverage(controlId, request.isCovered()));
    }

    /**
     * DELETE /api/v1/frameworks/{code}/controls/{controlId}
     * Permanently deletes a control (also refreshes framework stats).
     */
    @DeleteMapping("/{code}/controls/{controlId}")
    public ResponseEntity<ApiResponse> deleteControl(
            @PathVariable String code,
            @PathVariable String controlId) {
        frameworkService.deleteControl(controlId);
        return ResponseEntity.ok(new ApiResponse(true, "Control deleted successfully"));
    }
}
