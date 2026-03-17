package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.DocumentDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.service.AuditService;
import com.techcorp.compliance.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Document Management Controller
 * 
 * Endpoints:
 * - POST   /api/v1/documents/upload - Upload a document
 * - GET    /api/v1/documents - Get all documents
 * - GET    /api/v1/documents/{id} - Get single document
 * - DELETE /api/v1/documents/{id} - Delete document
 * - GET    /api/v1/documents/{id}/download - Get download URL
 */
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final AuditService    auditService;

    /**
     * Upload a new document
     * 
     * POST /api/v1/documents/upload
     * Content-Type: multipart/form-data
     * 
     * Form fields:
     * - file: The document file (required)
     * - name: Document name (optional, defaults to filename)
     * - description: Document description (optional)
     * - frameworkIds: Comma-separated framework IDs (optional)
     * - type: Document type (optional: policy, procedure, evidence, other)
     * 
     * Example using curl:
     * curl -X POST http://localhost:8080/api/v1/documents/upload \
     *   -H "Authorization: Bearer {token}" \
     *   -F "file=@/path/to/policy.pdf" \
     *   -F "name=Security Policy" \
     *   -F "frameworkIds=ISO27001,SOC2" \
     *   -F "type=policy"
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "frameworkIds", required = false) String frameworkIds,
            @RequestParam(value = "type", required = false) String type
    ) {
        log.info("Uploading document: {} ({})", file.getOriginalFilename(), file.getSize());
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Build request
            DocumentUploadRequest request = DocumentUploadRequest.builder()
                    .file(file)
                    .name(name != null ? name : file.getOriginalFilename())
                    .description(description)
                    .frameworkIds(frameworkIds)
                    .type(type)
                    .build();
            
            // Upload
            DocumentResponse response = documentService.uploadDocument(request);
            auditService.log(Action.DOCUMENT_UPLOADED, "Document", response.getId(),
                    response.getName(), "Uploaded: " + response.getName()
                    + " (" + response.getSize() + ") frameworks=" + response.getFrameworks());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("Failed to upload document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all documents
     * 
     * GET /api/v1/documents
     * 
     * Optional query parameters:
     * - framework: Filter by framework code (e.g., ISO27001)
     * - type: Filter by document type (policy, procedure, evidence, other)
     */
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAllDocuments(
            @RequestParam(value = "framework", required = false) String framework,
            @RequestParam(value = "type", required = false) String type
    ) {
        log.info("Getting all documents (framework={}, type={})", framework, type);
        List<DocumentResponse> documents = documentService.getAllDocuments(framework, type);
        return ResponseEntity.ok(documents);
    }

    /**
     * Get single document by ID
     * 
     * GET /api/v1/documents/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable String id) {
        log.info("Getting document: {}", id);
        return documentService.getDocumentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a document
     * 
     * DELETE /api/v1/documents/{id}
     * 
     * This will:
     * 1. Delete the file from storage (Cloudinary/Local)
     * 2. Delete the database record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        log.info("Deleting document: {}", id);
        
        try {
            documentService.deleteDocument(id);
            auditService.log(Action.DOCUMENT_DELETED, "Document", id,
                    id, "Document deleted");
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete document: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get download URL for a document
     * 
     * GET /api/v1/documents/{id}/download
     * 
     * Returns a direct download URL that can be used in:
     * - <a href="{url}" download>Download</a>
     * - window.open(url)
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<DownloadUrlResponse> getDownloadUrl(@PathVariable String id) {
        log.info("Getting download URL for document: {}", id);
        
        return documentService.getDocumentById(id)
                .map(doc -> {
                    String downloadUrl = documentService.getDownloadUrl(doc.getFileUrl());
                    return ResponseEntity.ok(DownloadUrlResponse.builder()
                            .documentId(doc.getId())
                            .downloadUrl(downloadUrl)
                            .filename(doc.getFilename())
                            .build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get document statistics
     *
     * GET /api/v1/documents/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<DocumentStatsResponse> getStats() {
        log.info("Getting document statistics");
        DocumentStatsResponse stats = documentService.getDocumentStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Re-run Tika text extraction on an already-uploaded document.
     * Also re-maps frameworks and recalculates coverage score.
     *
     * POST /api/v1/documents/{id}/analyze
     *
     * Called by the "Analyze" (re-extract) icon button in DocumentsPage.
     * Also called automatically after "Save to Docs" in PolicyGeneratorPage
     * to verify the generated policy covers the right controls.
     */
    @PostMapping("/{id}/analyze")
    public ResponseEntity<DocumentResponse> analyzeDocument(@PathVariable String id) {
        log.info("Analyzing document: {}", id);
        try {
            DocumentResponse response = documentService.analyze(id);
            auditService.log(Action.DOCUMENT_ANALYZED, "Document", id,
                    response.getName(), "Re-extracted text, frameworks=" + response.getFrameworks()
                    + " score=" + response.getCoverageScore());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Analysis failed for document: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search documents by name keyword.
     *
     * GET /api/v1/documents/search?keyword=access+control
     *
     * Separate from GET /documents (which supports framework/type filters)
     * so the Documents page search bar doesn't conflict with filter params.
     */
    @GetMapping("/search")
    public ResponseEntity<List<DocumentResponse>> searchDocuments(
            @RequestParam("keyword") String keyword) {
        log.info("Searching documents by keyword: {}", keyword);
        List<DocumentResponse> results = documentService.getAll(keyword);
        return ResponseEntity.ok(results);
    }
}
