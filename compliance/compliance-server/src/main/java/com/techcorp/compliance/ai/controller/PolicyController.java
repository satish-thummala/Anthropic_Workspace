package com.techcorp.compliance.ai.controller;

import com.techcorp.compliance.ai.dto.PolicyDTOs.*;
import com.techcorp.compliance.ai.service.PolicyGeneratorService;
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
    public ResponseEntity<List<PolicyTypeInfo>> getTypes() {
        log.info("GET /ai/policy/types");
        return ResponseEntity.ok(policyService.getSupportedTypes());
    }
}
