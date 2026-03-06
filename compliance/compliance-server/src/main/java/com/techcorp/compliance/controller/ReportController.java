package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.ReportDTOs.*;
import com.techcorp.compliance.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    // ── GET /api/v1/reports ───────────────────────────────────────────────────
    /**
     * Returns all generated reports, newest first.
     * 
     * React: ReportsPage table
     */
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAll() {
        return ResponseEntity.ok(reportService.getAll());
    }

    // ── GET /api/v1/reports/stats ─────────────────────────────────────────────
    /**
     * Returns statistics about reports.
     * 
     * React: ReportsPage header stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ReportStats> getStats() {
        return ResponseEntity.ok(reportService.getStats());
    }

    // ── GET /api/v1/reports/types ─────────────────────────────────────────────
    /**
     * Returns available report types with descriptions.
     * 
     * React: Report type selector cards
     */
    @GetMapping("/types")
    public ResponseEntity<List<ReportTypeInfo>> getTypes() {
        return ResponseEntity.ok(reportService.getAvailableTypes());
    }

    // ── GET /api/v1/reports/{id} ──────────────────────────────────────────────
    /**
     * Returns single report by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(reportService.getById(id));
    }

    // ── POST /api/v1/reports/generate ─────────────────────────────────────────
    /**
     * Initiates report generation asynchronously.
     * Returns immediately with report in 'generating' status.
     * 
     * React: "Generate Report" button
     * 
     * Request body:
     * {
     *   "type": "gap",                    // gap | coverage | risk | audit | policy | executive
     *   "format": "PDF",                  // PDF | Excel | Word (optional, default: PDF)
     *   "frameworkCode": "ISO27001",      // optional filter
     *   "severity": "CRITICAL",           // optional filter
     *   "title": "Custom Title",          // optional
     *   "includeCharts": true,            // optional, default: true
     *   "includeDetails": true            // optional, default: true
     * }
     * 
     * Response:
     * {
     *   "reportId": "uuid",
     *   "status": "generating",
     *   "message": "Report generation started",
     *   "estimatedSeconds": 5
     * }
     */
    @PostMapping("/generate")
    public ResponseEntity<GenerateReportResponse> generate(
            @Valid @RequestBody GenerateReportRequest request) {
        log.info("POST /reports/generate - type={}, format={}", 
                request.getType(), request.getFormat());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(reportService.generate(request));
    }

    // ── GET /api/v1/reports/{id}/download ─────────────────────────────────────
    /**
     * Returns file path for download.
     * In production, this would return actual file bytes with proper headers.
     * 
     * React: Download button on each report
     * 
     * Note: For production, change return type to ResponseEntity<Resource>
     * and stream the actual file.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<DownloadResponse> download(@PathVariable String id) {
        log.info("GET /reports/{}/download", id);
        String filePath = reportService.getDownloadPath(id);
        
        // In production, stream the actual file:
        // Resource file = fileStorageService.loadAsResource(filePath);
        // return ResponseEntity.ok()
        //     .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
        //     .body(file);
        
        // For now, return file path
        return ResponseEntity.ok(new DownloadResponse(filePath, "Report download initiated"));
    }

    // ── DELETE /api/v1/reports/{id} ───────────────────────────────────────────
    /**
     * Deletes a report.
     * 
     * React: Delete button on each report
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("DELETE /reports/{}", id);
        reportService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helper DTO ────────────────────────────────────────────────────────────

    public record DownloadResponse(String filePath, String message) {}
}
