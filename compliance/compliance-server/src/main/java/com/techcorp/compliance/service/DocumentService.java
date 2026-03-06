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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository docRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── Framework inference — mirrors DocumentMappingService keyword logic ─────
    // When a document is analyzed we assign it to frameworks based on its name.
    // Same deterministic mapping used by the bulk "Map All Documents" feature.
    private static final Map<String, List<String>> NAME_TO_FRAMEWORKS = Map.of(
        "information security", List.of("ISO27001", "SOC2"),
        "data protection",      List.of("GDPR", "ISO27001"),
        "hr employee",          List.of("ISO27001"),
        "it security",          List.of("ISO27001", "HIPAA", "SOC2"),
        "business continuity",  List.of("SOC2", "ISO27001"),
        "hipaa",                List.of("HIPAA"),
        "gdpr",                 List.of("GDPR"),
        "soc2",                 List.of("SOC2"),
        "iso27001",             List.of("ISO27001")
    );

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

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
                .total(     (int) docRepo.count())
                .analyzed(  (int) docRepo.countByStatus(Status.analyzed))
                .processing((int) docRepo.countByStatus(Status.processing))
                .queued(    (int) docRepo.countByStatus(Status.queued))
                .error(     (int) docRepo.countByStatus(Status.error))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /documents/upload
     * Registers a new document in 'queued' state (metadata only — no file bytes).
     */
    @Transactional
    public DocumentResponse upload(UploadRequest req) {
        String ext = extractExt(req.getName());

        Document doc = Document.builder()
                .name(req.getName())
                .fileType(ext)
                .fileSizeBytes(req.getFileSizeBytes())
                .fileSizeLabel(req.getFileSizeLabel() != null ? req.getFileSizeLabel() : formatBytes(req.getFileSizeBytes()))
                .status(Status.queued)
                .uploadedByName(req.getUploadedByName())
                .build();

        docRepo.save(doc);
        log.info("Document uploaded: {} ({})", doc.getName(), doc.getId());
        return toResponse(doc);
    }

    /**
     * POST /documents/{id}/analyze
     * Simulates analysis: queued/error → processing → analyzed
     * Assigns framework codes + a deterministic coverage score from the name.
     */
    @Transactional
    public DocumentResponse analyze(String id) {
        Document doc = find(id);

        doc.setStatus(Status.processing);
        docRepo.save(doc);

        // Determine frameworks from name keywords
        List<String> frameworks = inferFrameworks(doc.getName());

        // Deterministic score: base 60 + 8 per matched framework + hash contribution 0-19
        int score = Math.min(100, 60 + (frameworks.size() * 8) + (Math.abs(doc.getName().hashCode()) % 20));

        doc.setFrameworkCodes(frameworks);
        doc.setCoverageScore(score);
        doc.setStatus(Status.analyzed);
        doc.setAnalyzedAt(LocalDateTime.now());
        docRepo.save(doc);

        log.info("Document analyzed: {} score={} frameworks={}", doc.getName(), score, frameworks);
        return toResponse(doc);
    }

    /**
     * DELETE /documents/{id}
     */
    @Transactional
    public void delete(String id) {
        Document doc = find(id);
        docRepo.delete(doc);
        log.info("Document deleted: {}", doc.getName());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Document find(String id) {
        return docRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private List<String> inferFrameworks(String name) {
        String lower = name.toLowerCase();
        for (Map.Entry<String, List<String>> e : NAME_TO_FRAMEWORKS.entrySet()) {
            if (lower.contains(e.getKey())) return e.getValue();
        }
        return List.of("ISO27001"); // generic fallback
    }

    private String extractExt(String name) {
        if (name == null) return "FILE";
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "FILE" : name.substring(dot + 1).toUpperCase();
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0)           return "0 B";
        if (bytes < 1_024)        return bytes + " B";
        if (bytes < 1_048_576)    return String.format("%.0f KB", bytes / 1_024.0);
        return String.format("%.1f MB", bytes / 1_048_576.0);
    }

    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .type(d.getFileType())
                .size(d.getFileSizeLabel().isBlank() ? formatBytes(d.getFileSizeBytes()) : d.getFileSizeLabel())
                .status(d.getStatus().name())
                .coverageScore(d.getCoverageScore())
                .frameworks(new ArrayList<>(d.getFrameworkCodes()))
                .uploadedByName(d.getUploadedByName())
                .uploadedAt(d.getUploadedAt() != null ? d.getUploadedAt().format(DATE_FMT) : null)
                .analyzedAt(d.getAnalyzedAt() != null ? d.getAnalyzedAt().format(DATE_FMT) : null)
                .build();
    }
}
