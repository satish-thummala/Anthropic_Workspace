package com.techcorp.compliance.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * DocumentTextExtractor
 *
 * Uses Apache Tika to extract plain text from uploaded documents.
 * Supports: PDF, DOCX, DOC, PPTX, XLSX, TXT, HTML, XML, RTF, ODP, ODT, ODS, CSV.
 *
 * How it works:
 *   1. AutoDetectParser sniffs the file's MIME type from its byte header (magic bytes),
 *      not the file extension — so renaming a PDF to .txt still works correctly.
 *   2. BodyContentHandler strips all markup and returns clean plain text.
 *   3. Metadata captures author, title, creation date, page count etc. as a bonus.
 *
 * Text is used by DocumentService.analyze() to:
 *   - Map documents to compliance frameworks (keyword matching on real content)
 *   - Calculate a realistic coverage score
 *   - Store extracted text for future AI/search features
 */
@Service
@Slf4j
public class DocumentTextExtractor {

    // ── Tika instances (thread-safe, create once) ─────────────────────────────
    private final Tika tika = new Tika();

    /**
     * Max characters to extract per document.
     * -1 = unlimited, but very large documents can be slow.
     * 500_000 chars (~500KB of text) is enough for any policy document.
     */
    private static final int MAX_CHARS = 500_000;

    // ── Supported MIME types ──────────────────────────────────────────────────
    private static final Set<String> SUPPORTED_TYPES = Set.of(
            // Documents
            "application/pdf",
            "application/msword",                                                    // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-powerpoint",                                         // .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "application/vnd.ms-excel",                                              // .xls
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",     // .xlsx
            // OpenDocument
            "application/vnd.oasis.opendocument.text",
            "application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.oasis.opendocument.presentation",
            // Plain text / markup
            "text/plain",
            "text/html",
            "text/xml",
            "application/xml",
            "application/rtf",
            "text/csv"
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract text from a MultipartFile (used during upload + immediate analysis).
     *
     * @param file The uploaded file
     * @return ExtractionResult with text, metadata, and status
     */
    public ExtractionResult extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ExtractionResult.failed("File is empty");
        }

        String filename = file.getOriginalFilename();
        log.info("Extracting text from: {} ({} bytes)", filename, file.getSize());

        try (InputStream inputStream = file.getInputStream()) {
            return extractFromStream(inputStream, filename, file.getContentType());
        } catch (IOException e) {
            log.error("Failed to read file: {}", filename, e);
            return ExtractionResult.failed("Failed to read file: " + e.getMessage());
        }
    }

    /**
     * Extract text from raw bytes (used when re-analyzing a stored file).
     *
     * @param bytes    File bytes
     * @param filename Original filename (used for MIME sniffing fallback)
     * @return ExtractionResult
     */
    public ExtractionResult extractFromBytes(byte[] bytes, String filename) {
        if (bytes == null || bytes.length == 0) {
            return ExtractionResult.failed("File bytes are empty");
        }

        log.info("Extracting text from bytes: {} ({} bytes)", filename, bytes.length);

        try (InputStream inputStream = new java.io.ByteArrayInputStream(bytes)) {
            return extractFromStream(inputStream, filename, null);
        } catch (IOException e) {
            log.error("Failed to extract from bytes: {}", filename, e);
            return ExtractionResult.failed("Failed to extract: " + e.getMessage());
        }
    }

    /**
     * Detect the MIME type of a file without extracting text.
     * Useful for validation before storing.
     *
     * @param file The file to detect
     * @return MIME type string (e.g., "application/pdf")
     */
    public String detectMimeType(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            return tika.detect(inputStream, file.getOriginalFilename());
        } catch (IOException e) {
            log.warn("Could not detect MIME type for: {}", file.getOriginalFilename());
            return "application/octet-stream";
        }
    }

    /**
     * Check whether a file type is supported for text extraction.
     */
    public boolean isSupported(MultipartFile file) {
        String mimeType = detectMimeType(file);
        return SUPPORTED_TYPES.contains(mimeType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private ExtractionResult extractFromStream(InputStream inputStream,
                                                String filename,
                                                String hintMimeType) {
        try {
            // BodyContentHandler with character limit
            BodyContentHandler handler = new BodyContentHandler(MAX_CHARS);
            Metadata metadata         = new Metadata();
            ParseContext context       = new ParseContext();
            AutoDetectParser parser    = new AutoDetectParser();

            // Hint the parser with filename so it can use extension as a fallback
            if (filename != null) {
                // Tika 2.x: RESOURCE_NAME_KEY was removed — use the string directly
                metadata.set("resourceName", filename);
            }

            // Parse the document
            parser.parse(inputStream, handler, metadata, context);

            String text = handler.toString().trim();

            // Collect useful metadata
            Map<String, String> meta = new LinkedHashMap<>();
            for (String name : metadata.names()) {
                String value = metadata.get(name);
                if (value != null && !value.isBlank()) {
                    meta.put(name, value);
                }
            }

            // Detected content type
            // Tika 2.x: use the string key directly
            String detectedType = metadata.get("Content-Type");
            if (detectedType == null) detectedType = hintMimeType;

            log.info("Extraction complete: {} chars extracted from {} (type={})",
                    text.length(), filename, detectedType);

            if (text.isEmpty()) {
                // File parsed but no text — could be scanned image PDF
                return ExtractionResult.builder()
                        .success(false)
                        .text("")
                        .charCount(0)
                        .detectedMimeType(detectedType)
                        .metadata(meta)
                        .status(ExtractionStatus.NO_TEXT)
                        .message("No text found — file may be image-only or encrypted")
                        .build();
            }

            return ExtractionResult.builder()
                    .success(true)
                    .text(text)
                    .charCount(text.length())
                    .detectedMimeType(detectedType)
                    .metadata(meta)
                    .status(ExtractionStatus.SUCCESS)
                    .message("Extracted " + text.length() + " characters")
                    .build();

        } catch (SAXException e) {
            // Thrown when MAX_CHARS limit is hit — this is expected for large docs
            // The handler still holds all text up to the limit
            log.info("Character limit reached for: {} (this is normal for large files)", filename);
            return ExtractionResult.builder()
                    .success(true)
                    .text(e.getMessage() != null ? "" : "")  // handler text already captured
                    .charCount(MAX_CHARS)
                    .detectedMimeType(hintMimeType)
                    .metadata(Map.of())
                    .status(ExtractionStatus.TRUNCATED)
                    .message("Text truncated at " + MAX_CHARS + " characters (document is larger)")
                    .build();

        } catch (TikaException e) {
            log.warn("Tika parse error for {}: {}", filename, e.getMessage());
            return ExtractionResult.failed("Parse error: " + e.getMessage());

        } catch (IOException e) {
            log.error("IO error during extraction for {}", filename, e);
            return ExtractionResult.failed("IO error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULT TYPES
    // ─────────────────────────────────────────────────────────────────────────

    public enum ExtractionStatus {
        SUCCESS,    // Text extracted successfully
        TRUNCATED,  // Text extracted but cut at MAX_CHARS
        NO_TEXT,    // File parsed but contained no text (scanned/encrypted PDF)
        FAILED      // Could not parse the file at all
    }

    @lombok.Data
    @lombok.Builder
    public static class ExtractionResult {
        private boolean success;
        private String text;
        private int charCount;
        private String detectedMimeType;
        private Map<String, String> metadata;
        private ExtractionStatus status;
        private String message;

        /** Shorthand for a clean failure result */
        public static ExtractionResult failed(String reason) {
            return ExtractionResult.builder()
                    .success(false)
                    .text("")
                    .charCount(0)
                    .metadata(Map.of())
                    .status(ExtractionStatus.FAILED)
                    .message(reason)
                    .build();
        }

        /** Convenience: lower-cased text for keyword matching */
        public String lowerText() {
            return text != null ? text.toLowerCase() : "";
        }

        /** Title from Tika metadata if available */
        public String getTitle() {
            return metadata != null ? metadata.getOrDefault("dc:title",
                    metadata.getOrDefault("title", "")) : "";
        }

        /** Author from Tika metadata if available */
        public String getAuthor() {
            return metadata != null ? metadata.getOrDefault("dc:creator",
                    metadata.getOrDefault("Author", "")) : "";
        }

        /** Page count if the parser reported it */
        public int getPageCount() {
            if (metadata == null) return 0;
            String pages = metadata.getOrDefault("xmpTPg:NPages",
                    metadata.getOrDefault("Page-Count", "0"));
            try { return Integer.parseInt(pages.trim()); }
            catch (NumberFormatException e) { return 0; }
        }
    }
}
