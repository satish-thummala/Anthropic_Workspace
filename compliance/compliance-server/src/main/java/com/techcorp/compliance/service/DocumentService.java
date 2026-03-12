package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.DocumentDTOs.*;
import com.techcorp.compliance.entity.Document;
import com.techcorp.compliance.entity.Document.Status;
import com.techcorp.compliance.repository.DocumentRepository;
import com.techcorp.compliance.service.DocumentTextExtractor.ExtractionResult;
import com.techcorp.compliance.service.DocumentTextExtractor.ExtractionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository      docRepo;
    private final FileStorageService      fileStorageService;
    private final DocumentTextExtractor   textExtractor;      // ← NEW: Tika

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ─────────────────────────────────────────────────────────────────────────
    // FRAMEWORK KEYWORD MAP
    //
    // Keys  = keyword phrases to search in the REAL extracted text
    // Values = compliance frameworks that keyword signals
    //
    // This replaces the old name-only heuristic. Because we now have the full
    // document text we can use richer, multi-word phrases and individual terms.
    // ─────────────────────────────────────────────────────────────────────────
    private static final Map<String, List<String>> KEYWORD_TO_FRAMEWORKS = new LinkedHashMap<>() {{
        // ISO 27001
        put("information security management",  List.of("ISO27001"));
        put("isms",                             List.of("ISO27001"));
        put("annex a",                          List.of("ISO27001"));
        put("asset management",                 List.of("ISO27001"));
        put("access control",                   List.of("ISO27001", "SOC2", "HIPAA"));
        put("cryptography",                     List.of("ISO27001", "SOC2"));
        put("physical security",                List.of("ISO27001", "SOC2"));
        put("incident management",              List.of("ISO27001", "SOC2"));
        put("business continuity",              List.of("ISO27001", "SOC2"));
        put("supplier relationships",           List.of("ISO27001"));
        put("vulnerability management",         List.of("ISO27001", "SOC2"));
        put("change management",                List.of("ISO27001", "SOC2"));
        put("risk assessment",                  List.of("ISO27001", "SOC2"));
        put("security policy",                  List.of("ISO27001", "SOC2"));

        // SOC 2
        put("trust service criteria",           List.of("SOC2"));
        put("common criteria",                  List.of("SOC2"));
        put("availability",                     List.of("SOC2"));
        put("processing integrity",             List.of("SOC2"));
        put("confidentiality",                  List.of("SOC2"));
        put("logical access",                   List.of("SOC2"));
        put("monitoring controls",              List.of("SOC2"));
        put("system operations",                List.of("SOC2"));
        put("change control",                   List.of("SOC2", "ISO27001"));
        put("service organization",             List.of("SOC2"));
        put("aicpa",                            List.of("SOC2"));

        // GDPR
        put("personal data",                    List.of("GDPR"));
        put("data subject",                     List.of("GDPR"));
        put("lawful basis",                     List.of("GDPR"));
        put("right to erasure",                 List.of("GDPR"));
        put("right to access",                  List.of("GDPR"));
        put("data protection officer",          List.of("GDPR"));
        put("dpo",                              List.of("GDPR"));
        put("dpia",                             List.of("GDPR"));
        put("data protection impact",           List.of("GDPR"));
        put("privacy by design",                List.of("GDPR"));
        put("data breach notification",         List.of("GDPR", "HIPAA"));
        put("data processor",                   List.of("GDPR"));
        put("data controller",                  List.of("GDPR"));
        put("consent",                          List.of("GDPR"));
        put("gdpr",                             List.of("GDPR"));
        put("general data protection",          List.of("GDPR"));

        // HIPAA
        put("protected health information",     List.of("HIPAA"));
        put("phi",                              List.of("HIPAA"));
        put("hipaa",                            List.of("HIPAA"));
        put("covered entity",                   List.of("HIPAA"));
        put("business associate",               List.of("HIPAA"));
        put("minimum necessary",                List.of("HIPAA"));
        put("notice of privacy practices",      List.of("HIPAA"));
        put("electronic health record",         List.of("HIPAA"));
        put("ehr",                              List.of("HIPAA"));
        put("health information",               List.of("HIPAA"));
        put("patient data",                     List.of("HIPAA"));
        put("safeguards",                       List.of("HIPAA", "ISO27001"));
        put("workforce training",               List.of("HIPAA", "ISO27001"));

        // Shared / generic compliance signals
        put("audit trail",                      List.of("ISO27001", "SOC2", "HIPAA"));
        put("encryption",                       List.of("ISO27001", "SOC2", "GDPR", "HIPAA"));
        put("multi-factor authentication",      List.of("ISO27001", "SOC2"));
        put("mfa",                              List.of("ISO27001", "SOC2"));
        put("privileged access",                List.of("ISO27001", "SOC2"));
        put("penetration test",                 List.of("ISO27001", "SOC2"));
        put("patch management",                 List.of("ISO27001", "SOC2"));
        put("disaster recovery",                List.of("ISO27001", "SOC2"));
        put("data retention",                   List.of("ISO27001", "GDPR", "HIPAA"));
        put("third party",                      List.of("ISO27001", "SOC2"));
        put("vendor management",                List.of("ISO27001", "SOC2"));
    }};

    // Coverage score weights per framework matched (max 100)
    private static final int BASE_SCORE     = 45;
    private static final int PER_FRAMEWORK  = 8;
    private static final int PER_KEYWORD    = 2;
    private static final int MAX_KW_BONUS   = 30;

    // ─────────────────────────────────────────────────────────────────────────
    // READ METHODS
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
        return documents.stream().map(this::toNewResponse).collect(Collectors.toList());
    }

    public Optional<DocumentResponse> getDocumentById(String id) {
        return docRepo.findById(id).map(this::toNewResponse);
    }

    public String getDownloadUrl(String fileUrl) {
        return fileStorageService.getDownloadUrl(fileUrl);
    }

    public DocumentStatsResponse getDocumentStats() {
        long total      = docRepo.count();
        long policies   = docRepo.countByType("policy");
        long procedures = docRepo.countByType("procedure");
        long evidence   = docRepo.countByType("evidence");
        long other      = total - policies - procedures - evidence;
        return DocumentStatsResponse.builder()
                .totalDocuments((int) total)
                .byType(DocumentStatsResponse.TypeBreakdown.builder()
                        .policy((int) policies)
                        .procedure((int) procedures)
                        .evidence((int) evidence)
                        .other((int) Math.max(0, other))
                        .build())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPLOAD — Real file upload with immediate text extraction
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Upload with real file storage (Cloudinary or local).
     *
     * Flow:
     *   1. Store the file bytes via FileStorageService
     *   2. Extract text immediately using Tika (fast — runs in same request)
     *   3. If extraction succeeds → run framework mapping now, status = analyzed
     *   4. If extraction fails   → status = queued (user can retry via Analyze button)
     */
    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request) {
        log.info("Uploading document: {}", request.getName());

        try {
            // 1. Store file
            String fileUrl = fileStorageService.storeFile(
                    request.getFile(),
                    "documents/" + getDocumentFolder(request.getType()));

            // 2. Extract text with Tika
            ExtractionResult extraction = textExtractor.extract(request.getFile());
            log.info("Extraction result: status={}, chars={}", extraction.getStatus(), extraction.getCharCount());

            // 3. Determine frameworks and score from real text (or fall back to name)
            String textForMapping = extraction.isSuccess() && !extraction.getText().isBlank()
                    ? extraction.getText()
                    : request.getName();

            List<String> frameworks = mapToFrameworks(textForMapping);
            int score = calculateCoverageScore(textForMapping, frameworks);

            // 4. Build and save entity
            Status docStatus = extraction.isSuccess() ? Status.analyzed : Status.queued;

            Document document = Document.builder()
                    .name(request.getName())
                    .filename(request.getFile().getOriginalFilename())
                    .fileType(extraction.getDetectedMimeType() != null
                            ? extraction.getDetectedMimeType()
                            : request.getFile().getContentType())
                    .fileSizeBytes(request.getFile().getSize())
                    .fileSizeLabel(formatBytes(request.getFile().getSize()))
                    .fileUrl(fileUrl)
                    .description(request.getDescription())
                    .type(request.getType() != null ? request.getType() : "other")
                    .frameworkIds(String.join(",", frameworks))
                    .frameworkCodes(new ArrayList<>(frameworks))
                    .extractedText(extraction.isSuccess() ? extraction.getText() : null)
                    .extractionStatus(extraction.getStatus().name())
                    .coverageScore(extraction.isSuccess() ? score : null)
                    .status(docStatus)
                    .uploadedAt(LocalDateTime.now())
                    .analyzedAt(extraction.isSuccess() ? LocalDateTime.now() : null)
                    .uploadedByName(request.getUploadedByName())
                    .build();

            document = docRepo.save(document);
            log.info("Document saved: id={}, status={}, frameworks={}, score={}",
                    document.getId(), docStatus, frameworks, score);

            return toNewResponse(document);

        } catch (Exception e) {
            log.error("Failed to upload document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    /**
     * Backward-compatible metadata-only upload (kept for old clients).
     * Does NOT extract text — status stays queued until Analyze is clicked.
     */
    @Transactional
    public DocumentResponse upload(UploadRequest req) {
        String ext = extractExt(req.getName());
        Document doc = Document.builder()
                .name(req.getName())
                .fileType(ext)
                .fileSizeBytes(req.getFileSizeBytes())
                .fileSizeLabel(req.getFileSizeLabel() != null
                        ? req.getFileSizeLabel() : formatBytes(req.getFileSizeBytes()))
                .status(Status.queued)
                .uploadedByName(req.getUploadedByName())
                .build();
        docRepo.save(doc);
        log.info("Document registered (metadata only): {} ({})", doc.getName(), doc.getId());
        return toResponse(doc);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYZE — Re-extract text and re-map frameworks
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Triggered by the "Analyze" button in the UI.
     *
     * If the document has a fileUrl (real upload) → fetch bytes from storage
     * and run Tika extraction again. This lets users re-analyze after editing.
     *
     * If no fileUrl (legacy metadata-only record) → fall back to name-based mapping.
     */
    @Transactional
    public DocumentResponse analyze(String id) {
        Document doc = find(id);

        log.info("Analyzing document: {} ({})", doc.getName(), id);
        doc.setStatus(Status.processing);
        docRepo.save(doc);

        try {
            List<String> frameworks;
            int score;
            String extractedText = null;
            String extractionStatus;

            if (doc.getFileUrl() != null && !doc.getFileUrl().isBlank()) {
                // ── Real file: fetch bytes and run Tika ───────────────────────
                byte[] fileBytes = fetchFileBytes(doc.getFileUrl());

                if (fileBytes != null && fileBytes.length > 0) {
                    ExtractionResult extraction = textExtractor.extractFromBytes(
                            fileBytes, doc.getFilename() != null ? doc.getFilename() : doc.getName());

                    log.info("Re-extraction: status={}, chars={}", extraction.getStatus(), extraction.getCharCount());

                    String textForMapping = extraction.isSuccess() && !extraction.getText().isBlank()
                            ? extraction.getText()
                            : doc.getName();

                    frameworks       = mapToFrameworks(textForMapping);
                    score            = calculateCoverageScore(textForMapping, frameworks);
                    extractedText    = extraction.isSuccess() ? extraction.getText() : doc.getExtractedText();
                    extractionStatus = extraction.getStatus().name();

                } else {
                    // File URL exists but bytes not retrievable (e.g. Cloudinary — fall back to name)
                    log.warn("Could not fetch bytes for: {}, falling back to name mapping", doc.getName());
                    frameworks       = mapToFrameworks(doc.getName());
                    score            = calculateCoverageScore(doc.getName(), frameworks);
                    extractedText    = doc.getExtractedText(); // keep whatever was stored
                    extractionStatus = ExtractionStatus.FAILED.name();
                }

            } else {
                // ── Legacy metadata-only document: name-based mapping ─────────
                log.info("No fileUrl for document {}, using name-based mapping", id);
                frameworks       = inferFrameworksFromName(doc.getName());
                score            = Math.min(100, 60 + (frameworks.size() * 8)
                        + (Math.abs(doc.getName().hashCode()) % 20));
                extractionStatus = ExtractionStatus.FAILED.name();
            }

            // Persist results
            doc.setFrameworkCodes(new ArrayList<>(frameworks));
            doc.setFrameworkIds(String.join(",", frameworks));
            doc.setCoverageScore(score);
            doc.setExtractedText(extractedText);
            doc.setExtractionStatus(extractionStatus);
            doc.setStatus(Status.analyzed);
            doc.setAnalyzedAt(LocalDateTime.now());
            docRepo.save(doc);

            log.info("Analysis complete: {} → frameworks={}, score={}", doc.getName(), frameworks, score);
            return toResponse(doc);

        } catch (Exception e) {
            log.error("Analysis failed for document: {}", id, e);
            doc.setStatus(Status.error);
            docRepo.save(doc);
            throw new RuntimeException("Analysis failed: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String id) {
        Document doc = find(id);
        if (doc.getFileUrl() != null && !doc.getFileUrl().isEmpty()) {
            try {
                fileStorageService.deleteFile(doc.getFileUrl());
            } catch (Exception e) {
                log.warn("Failed to delete file from storage: {}", doc.getFileUrl(), e);
            }
        }
        docRepo.delete(doc);
        log.info("Document deleted: {}", doc.getName());
    }

    @Transactional
    public void deleteDocument(String id) {
        delete(id); // same logic
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEXT-BASED FRAMEWORK MAPPING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Map extracted text to compliance frameworks.
     *
     * Algorithm:
     *   For each keyword phrase in KEYWORD_TO_FRAMEWORKS:
     *     - If the phrase appears in the text → add its associated frameworks
     *   Return the unique set of matched frameworks, sorted.
     *
     * This works on real extracted text so a PDF containing "protected health
     * information" will correctly map to HIPAA even if its filename is generic.
     */
    public List<String> mapToFrameworks(String text) {
        if (text == null || text.isBlank()) {
            return List.of("ISO27001"); // safe default
        }

        String lower = text.toLowerCase();
        Set<String> matched = new LinkedHashSet<>();

        for (Map.Entry<String, List<String>> entry : KEYWORD_TO_FRAMEWORKS.entrySet()) {
            if (lower.contains(entry.getKey())) {
                matched.addAll(entry.getValue());
            }
        }

        if (matched.isEmpty()) {
            // No specific keywords found — default to ISO27001 (most common)
            matched.add("ISO27001");
        }

        List<String> result = new ArrayList<>(matched);
        Collections.sort(result);
        log.debug("Framework mapping: {} frameworks matched from text", result.size());
        return result;
    }

    /**
     * Calculate coverage score based on text richness.
     *
     * Score = BASE + (frameworks matched × PER_FRAMEWORK) + (keywords matched × PER_KEYWORD)
     * Capped at 100.
     */
    public int calculateCoverageScore(String text, List<String> frameworks) {
        if (text == null || text.isBlank()) return BASE_SCORE;

        String lower = text.toLowerCase();
        int keywordsMatched = 0;
        for (String keyword : KEYWORD_TO_FRAMEWORKS.keySet()) {
            if (lower.contains(keyword)) keywordsMatched++;
        }

        int keywordBonus  = Math.min(MAX_KW_BONUS, keywordsMatched * PER_KEYWORD);
        int frameworkBonus = frameworks.size() * PER_FRAMEWORK;
        int score = BASE_SCORE + frameworkBonus + keywordBonus;

        return Math.min(100, score);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Document find(String id) {
        return docRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    /**
     * Fetch file bytes from a stored URL.
     * Works for local storage (reads from disk) and Cloudinary (HTTP GET).
     */
    private byte[] fetchFileBytes(String fileUrl) {
        try {
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                // Remote URL (Cloudinary, S3, etc.) — HTTP GET
                java.net.URL url = new java.net.URI(fileUrl).toURL();
                try (java.io.InputStream is = url.openStream()) {
                    return is.readAllBytes();
                }
            } else {
                // Local file path
                java.nio.file.Path path = java.nio.file.Paths.get(fileUrl);
                if (java.nio.file.Files.exists(path)) {
                    return java.nio.file.Files.readAllBytes(path);
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch file bytes from: {}", fileUrl, e);
        }
        return null;
    }

    /**
     * Legacy name-based framework inference (fallback when no file content).
     */
    private List<String> inferFrameworksFromName(String name) {
        if (name == null) return List.of("ISO27001");
        String lower = name.toLowerCase();
        if (lower.contains("hipaa"))                                 return List.of("HIPAA");
        if (lower.contains("gdpr") || lower.contains("data protection")) return List.of("GDPR", "ISO27001");
        if (lower.contains("soc2") || lower.contains("soc 2"))       return List.of("SOC2");
        if (lower.contains("iso27001") || lower.contains("iso 27001")) return List.of("ISO27001");
        if (lower.contains("information security"))                  return List.of("ISO27001", "SOC2");
        if (lower.contains("it security"))                           return List.of("ISO27001", "HIPAA", "SOC2");
        if (lower.contains("business continuity"))                   return List.of("SOC2", "ISO27001");
        return List.of("ISO27001");
    }

    private String extractExt(String name) {
        if (name == null) return "FILE";
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "FILE" : name.substring(dot + 1).toUpperCase();
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0)         return "0 B";
        if (bytes < 1_024)      return bytes + " B";
        if (bytes < 1_048_576)  return String.format("%.0f KB", bytes / 1_024.0);
        return String.format("%.1f MB", bytes / 1_048_576.0);
    }

    private String getDocumentFolder(String type) {
        if (type == null) return "other";
        return switch (type.toLowerCase()) {
            case "policy"    -> "policies";
            case "procedure" -> "procedures";
            case "evidence"  -> "evidence";
            default          -> "other";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO MAPPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Old-format response — used by existing GapsPage / Dashboard calls
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
                .frameworks(d.getFrameworkCodes() != null
                        ? new ArrayList<>(d.getFrameworkCodes()) : List.of())
                .uploadedByName(d.getUploadedByName())
                .uploadedAt(d.getUploadedAt())
                .analyzedAt(d.getAnalyzedAt() != null ? d.getAnalyzedAt().format(DATE_FMT) : null)
                // Extraction info
                .extractionStatus(d.getExtractionStatus())
                .charCount(d.getExtractedText() != null ? d.getExtractedText().length() : 0)
                .build();
    }

    /**
     * New-format response — used by upload / download / file-aware endpoints
     */
    private DocumentResponse toNewResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .filename(d.getFilename())
                .fileType(d.getFileType())
                .fileSize(d.getFileSizeBytes())
                .fileUrl(d.getFileUrl())
                .description(d.getDescription())
                .type(d.getType())
                .frameworkIds(d.getFrameworkIds() != null
                        ? Arrays.asList(d.getFrameworkIds().split(",")) : List.of())
                .frameworks(d.getFrameworkCodes() != null
                        ? new ArrayList<>(d.getFrameworkCodes()) : List.of())
                .status(d.getStatus() != null ? d.getStatus().name() : "queued")
                .coverageScore(d.getCoverageScore())
                .uploadedAt(d.getUploadedAt())
                .analyzedAt(d.getAnalyzedAt() != null ? d.getAnalyzedAt().format(DATE_FMT) : null)
                .uploadedByName(d.getUploadedByName())
                .extractionStatus(d.getExtractionStatus())
                .charCount(d.getExtractedText() != null ? d.getExtractedText().length() : 0)
                .build();
    }
}
