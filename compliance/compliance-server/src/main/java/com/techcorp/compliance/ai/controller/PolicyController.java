package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.dto.PolicyDTOs.*;
import com.techcorp.compliance.ai.service.PolicyGeneratorService;
import com.techcorp.compliance.dto.DocumentDTOs.DocumentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PolicyController
 *
 * REST API for AI-powered policy document generation.
 *
 * Endpoints:
 *   POST /api/v1/ai/policy/generate   — generate a policy document
 *   GET  /api/v1/ai/policy/types      — list supported policy types
 */
@RestController
@RequestMapping("/api/v1/ai/policy")
@RequiredArgsConstructor
@Slf4j
public class PolicyController {

    private final PolicyGeneratorService policyService;

    /**
     * POST /api/v1/ai/policy/generate
     *
     * Generates a complete compliance policy document.
     *
     * Request body:
     * {
     *   "type":          "access_control",   // required
     *   "frameworkCode": "ISO27001",          // optional
     *   "orgName":       "Acme Corp"          // optional
     * }
     *
     * Response:
     * {
     *   "title":          "Access Control Policy — ISO/IEC 27001 | Acme Corp",
     *   "content":        "# Access Control Policy\n\n...",   // Markdown
     *   "policyType":     "access_control",
     *   "policyTypeLabel":"Access Control Policy",
     *   "framework":      "ISO/IEC 27001",
     *   "orgName":        "Acme Corp",
     *   "engine":         "groq",
     *   "durationMs":     1240,
     *   "generatedAt":    "2026-03-16T10:30:00"
     * }
     */
    @PostMapping("/generate")
    public ResponseEntity<PolicyGenerateResponse> generate(
            @RequestBody PolicyGenerateRequest request) {

        log.info("POST /ai/policy/generate type={} framework={} org={}",
                request.getType(),
                request.getFrameworkCode(),
                request.getOrgName());

        try {
            PolicyGenerateResponse response = policyService.generate(request);
            log.info("Policy generated: {} via {} in {}ms",
                    response.getTitle(), response.getEngine(), response.getDurationMs());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid policy request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    PolicyGenerateResponse.builder()
                            .title("Invalid Request")
                            .content("Error: " + e.getMessage())
                            .engine("none")
                            .build());
        } catch (Exception e) {
            log.error("Policy generation failed", e);
            return ResponseEntity.internalServerError().body(
                    PolicyGenerateResponse.builder()
                            .title("Generation Failed")
                            .content("An error occurred during generation. Please try again.")
                            .engine("none")
                            .build());
        }
    }

    /**
     * GET /api/v1/ai/policy/types
     *
     * Returns all supported policy types with metadata.
     * Use this to populate the policy type picker in the UI.
     */
    @GetMapping("/types")
    public ResponseEntity<java.util.List<PolicyTypeInfo>> getTypes() {
        log.info("GET /ai/policy/types");
        return ResponseEntity.ok(policyService.getSupportedTypes());
    }

    /**
     * POST /api/v1/ai/policy/save
     *
     * Saves a generated policy document into the Documents module so it:
     *   - Appears in the Documents page
     *   - Gets Tika text extraction (instant — markdown is plain text)
     *   - Gets framework codes set for gap detection
     *   - Can be analyzed by gap detection to verify it covers the right controls
     *
     * Request body: the full PolicyGenerateResponse echoed back with an
     * optional savedByName field added.
     *
     * Response: the created Document record (same shape as DocumentResponse).
     */
    @PostMapping("/save")
    public ResponseEntity<DocumentResponse> saveToDocuments(
            @RequestBody PolicySaveRequest request) {

        log.info("POST /ai/policy/save title={} framework={} by={}",
                request.getTitle(), request.getFramework(), request.getSavedByName());

        try {
            // Reconstruct a PolicyGenerateResponse from the save request
            // so we can reuse PolicyGeneratorService.saveToDocuments()
            PolicyGenerateResponse policy = PolicyGenerateResponse.builder()
                    .title(request.getTitle())
                    .content(request.getContent())
                    .policyType(request.getPolicyType())
                    .policyTypeLabel(request.getPolicyTypeLabel())
                    .framework(request.getFramework())
                    .orgName(request.getOrgName())
                    .engine(request.getEngine())
                    .generatedAt(java.time.LocalDateTime.now())
                    .build();

            DocumentResponse saved = policyService.saveToDocuments(policy, request.getSavedByName());
            log.info("Policy saved to Documents: id={}", saved.getId());
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Failed to save policy to Documents", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
