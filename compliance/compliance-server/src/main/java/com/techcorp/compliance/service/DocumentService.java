package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.DocumentDTOs.*;
import com.techcorp.compliance.entity.Document;
import com.techcorp.compliance.entity.Document.Status;
import com.techcorp.compliance.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository docRepo;
    private final FileStorageService fileStorageService; // NEW: For real file upload

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── Framework inference — mirrors DocumentMappingService keyword logic ─────
    private static final Map<String, List<String>> NAME_TO_FRAMEWORKS = Map.of(
            "information security", List.of("ISO27001", "SOC2"),
            "data protection", List.of("GDPR", "ISO27001"),
            "hr employee", List.of("ISO27001"),
            "it security", List.of("ISO27001", "HIPAA", "SOC2"),
            "business continuity", List.of("SOC2", "ISO27001"),
            "hipaa", List.of("HIPAA"),
            "gdpr", List.of("GDPR"),
            "soc2", List.of("SOC2"),
            "iso27001", List.of("ISO27001"));

    // ═════════════════════════════════════════════════════════════════════════
    // EXISTING METHODS (Keep for backward compatibility)
    // ═════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<DocumentResponse> getAll(String keyword) {
        List<Document> docs = (keyword != null && !keyword.isBlank())
                ? docRepo.searchByName(keyword.trim())
                : docRepo.findAllByOrderByUploadedAtDesc();
        return docs.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(String id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public DocumentStats getStats() {
        return DocumentStats.builder()
                .total((int) docRepo.count())
                .analyzed((int) docRepo.countByStatus(Status.analyzed))
                .processing((int) docRepo.countByStatus(Status.processing))
                .queued((int) docRepo.countByStatus(Status.queued))
                .error((int) docRepo.countByStatus(Status.error))
                .build();
    }

    /**
     * OLD METHOD: Metadata-only upload (for backward compatibility)
     * POST /documents/upload
     */
    @Transactional
    public DocumentResponse upload(UploadRequest req) {
        String ext = extractExt(req.getName());

        Document doc = Document.builder()
                .name(req.getName())
                .fileType(ext)
                .fileSizeBytes(req.getFileSizeBytes())
                .fileSizeLabel(
                        req.getFileSizeLabel() != null ? req.getFileSizeLabel() : formatBytes(req.getFileSizeBytes()))
                .status(Status.queued)
                .uploadedByName(req.getUploadedByName())
                .build();

        docRepo.save(doc);
        log.info("Document uploaded: {} ({})", doc.getName(), doc.getId());
        return toResponse(doc);
    }

    @Transactional
    public DocumentResponse analyze(String id) {
        Document doc = find(id);

        doc.setStatus(Status.processing);
        docRepo.save(doc);

        List<String> frameworks = inferFrameworks(doc.getName());
        int score = Math.min(100, 60 + (frameworks.size() * 8) + (Math.abs(doc.getName().hashCode()) % 20));

        doc.setFrameworkCodes(frameworks);
        doc.setCoverageScore(score);
        doc.setStatus(Status.analyzed);
        doc.setAnalyzedAt(LocalDateTime.now());
        docRepo.save(doc);

        log.info("Document analyzed: {} score={} frameworks={}", doc.getName(), score, frameworks);
        return toResponse(doc);
    }

    @Transactional
    public void delete(String id) {
        Document doc = find(id);

        // NEW: Delete file from storage if fileUrl exists
        if (doc.getFileUrl() != null && !doc.getFileUrl().isEmpty()) {
            try {
                fileStorageService.deleteFile(doc.getFileUrl());
                log.info("File deleted from storage: {}", doc.getFileUrl());
            } catch (Exception e) {
                log.warn("Failed to delete file from storage: {}", doc.getFileUrl(), e);
                // Continue with DB deletion even if file deletion fails
            }
        }

        docRepo.delete(doc);
        log.info("Document deleted: {}", doc.getName());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NEW METHODS: Real file upload with Cloudinary/Local storage
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * NEW METHOD: Upload with real file storage
     * POST /documents/upload (with multipart file)
     */
    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request) {
        log.info("Uploading document with file: {}", request.getName());

        try {
            // 1. Store file (Cloudinary or Local)
            String fileUrl = fileStorageService.storeFile(
                    request.getFile(),
                    "documents/" + getDocumentFolder(request.getType()));

            // 2. Create document entity
            Document document = Document.builder()
                    .id(UUID.randomUUID().toString())
                    .name(request.getName())
                    .filename(request.getFile().getOriginalFilename())
                    .fileType(request.getFile().getContentType())
                    .fileSizeBytes(request.getFile().getSize())
                    .fileSizeLabel(formatBytes(request.getFile().getSize()))
                    .fileUrl(fileUrl)
                    .description(request.getDescription())
                    .type(request.getType() != null ? request.getType() : "other")
                    .frameworkIds(request.getFrameworkIds())
                    .status(Status.queued)
                    .uploadedAt(LocalDateTime.now())
                    .build();

            // 3. Save to database
            document = docRepo.save(document);

            log.info("Document uploaded successfully: {} ({})", document.getId(), fileUrl);

            // 4. Return response
            return toNewResponse(document);

        } catch (Exception e) {
            log.error("Failed to upload document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    /**
     * NEW METHOD: Get all documents with optional filtering
     */
    public List<DocumentResponse> getAllDocuments(String framework, String type) {
        List<Document> documents;

        if (framework != null && type != null) {
            documents = docRepo.findByFrameworkIdsContainingAndType(framework, type);
        } else if (framework != null) {
            documents = docRepo.findByFrameworkIdsContaining(framework);
        } else if (type != null) {
            documents = docRepo.findByType(type);
        } else {
            documents = docRepo.findAll();
        }

        return documents.stream()
                .map(this::toNewResponse)
                .collect(Collectors.toList());
    }

    /**
     * NEW METHOD: Get document by ID (new format)
     */
    public Optional<DocumentResponse> getDocumentById(String id) {
        return docRepo.findById(id)
                .map(this::toNewResponse);
    }

    /**
     * NEW METHOD: Delete document (with file cleanup)
     */
    @Transactional
    public void deleteDocument(String id) {
        log.info("Deleting document: {}", id);

        Document document = docRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));

        try {
            // 1. Delete file from storage
            if (document.getFileUrl() != null) {
                fileStorageService.deleteFile(document.getFileUrl());
            }

            // 2. Delete database record
            docRepo.delete(document);

            log.info("Document deleted successfully: {}", id);

        } catch (Exception e) {
            log.error("Failed to delete document: {}", id, e);
            throw new RuntimeException("Failed to delete document: " + e.getMessage(), e);
        }
    }

    /**
     * NEW METHOD: Get download URL
     */
    public String getDownloadUrl(String fileUrl) {
        return fileStorageService.getDownloadUrl(fileUrl);
    }

    /**
     * NEW METHOD: Get document statistics (new format)
     */
    public DocumentStatsResponse getDocumentStats() {
        long total = docRepo.count();
        long policies = docRepo.countByType("policy");
        long procedures = docRepo.countByType("procedure");
        long evidence = docRepo.countByType("evidence");
        long other = total - policies - procedures - evidence;

        return DocumentStatsResponse.builder()
                .totalDocuments((int) total)
                .byType(DocumentStatsResponse.TypeBreakdown.builder()
                        .policy((int) policies)
                        .procedure((int) procedures)
                        .evidence((int) evidence)
                        .other((int) other)
                        .build())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    private Document find(String id) {
        return docRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private List<String> inferFrameworks(String name) {
        String lower = name.toLowerCase();
        for (Map.Entry<String, List<String>> e : NAME_TO_FRAMEWORKS.entrySet()) {
            if (lower.contains(e.getKey()))
                return e.getValue();
        }
        return List.of("ISO27001"); // generic fallback
    }

    private String extractExt(String name) {
        if (name == null)
            return "FILE";
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "FILE" : name.substring(dot + 1).toUpperCase();
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0)
            return "0 B";
        if (bytes < 1_024)
            return bytes + " B";
        if (bytes < 1_048_576)
            return String.format("%.0f KB", bytes / 1_024.0);
        return String.format("%.1f MB", bytes / 1_048_576.0);
    }

    /**
     * Get folder name based on document type
     */
    private String getDocumentFolder(String type) {
        if (type == null)
            return "other";

        switch (type.toLowerCase()) {
            case "policy":
                return "policies";
            case "procedure":
                return "procedures";
            case "evidence":
                return "evidence";
            default:
                return "other";
        }
    }

    /**
     * OLD format: Convert entity to response DTO (for backward compatibility)
     */
    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .type(d.getFileType())
                .size(d.getFileSizeLabel() != null && !d.getFileSizeLabel().isBlank()
                        ? d.getFileSizeLabel()
                        : formatBytes(d.getFileSizeBytes()))
                .status(d.getStatus() != null ? d.getStatus().name() : "queued")
                .coverageScore(d.getCoverageScore())
                .frameworks(d.getFrameworkCodes() != null ? new ArrayList<>(d.getFrameworkCodes()) : List.of())
                .uploadedByName(d.getUploadedByName())
                .uploadedAt(d.getUploadedAt())
                .analyzedAt(d.getAnalyzedAt() != null ? d.getAnalyzedAt().format(DATE_FMT) : null)
                .build();
    }

    /**
     * NEW format: Convert entity to response DTO (with file URL)
     */
    private DocumentResponse toNewResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .name(document.getName())
                .filename(document.getFilename())
                .fileType(document.getFileType())
                .fileSize(document.getFileSizeBytes())
                .fileUrl(document.getFileUrl())
                .description(document.getDescription())
                .type(document.getType())
                .frameworkIds(document.getFrameworkIds() != null
                        ? Arrays.asList(document.getFrameworkIds().split(","))
                        : List.of())
                .uploadedAt(document.getUploadedAt())
                .build();
    }
}
