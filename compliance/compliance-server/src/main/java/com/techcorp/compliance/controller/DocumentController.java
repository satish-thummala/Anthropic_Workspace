package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.DocumentDTOs.*;
import com.techcorp.compliance.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService docService;

    // ── GET /api/v1/documents ─────────────────────────────────────────────────
    /**
     * All documents, newest first.
     * Optional: ?keyword=security  → filters by name
     *
     * React: DocumentsPage table
     */
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAll(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(docService.getAll(keyword));
    }

    // ── GET /api/v1/documents/stats ───────────────────────────────────────────
    /**
     * Returns { total, analyzed, processing, queued, error }
     *
     * React: Dashboard "Documents Ingested" stat card
     */
    @GetMapping("/stats")
    public ResponseEntity<DocumentStats> getStats() {
        return ResponseEntity.ok(docService.getStats());
    }

    // ── GET /api/v1/documents/{id} ────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(docService.getById(id));
    }

    // ── POST /api/v1/documents/upload ─────────────────────────────────────────
    /**
     * Registers a document in 'queued' state (metadata only, no file bytes).
     *
     * Body: { name, fileSizeBytes, fileSizeLabel, uploadedByName }
     *
     * React: drop zone / file picker in DocumentsPage
     */
    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(@RequestBody UploadRequest req) {
        log.info("POST /documents/upload — {}", req.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(docService.upload(req));
    }

    // ── POST /api/v1/documents/{id}/analyze ───────────────────────────────────
    /**
     * Runs simulated analysis: assigns frameworks + coverage score.
     * Transitions: queued | error → processing → analyzed
     *
     * React: Play button on each document row
     */
    @PostMapping("/{id}/analyze")
    public ResponseEntity<DocumentResponse> analyze(@PathVariable String id) {
        log.info("POST /documents/{}/analyze", id);
        return ResponseEntity.ok(docService.analyze(id));
    }

    // ── DELETE /api/v1/documents/{id} ─────────────────────────────────────────
    /**
     * Permanently deletes the document record.
     *
     * React: Trash icon on each document row
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("DELETE /documents/{}", id);
        docService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
