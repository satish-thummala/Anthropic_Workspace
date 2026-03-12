package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

public class DocumentDTOs {

    // ─────────────────────────────────────────────────────────────────────────
    // REQUEST DTOs
    // ─────────────────────────────────────────────────────────────────────────

    /** Metadata-only upload (backward compat) */
    @Data @Builder
    public static class UploadRequest {
        private String name;
        private Long   fileSizeBytes;
        private String fileSizeLabel;
        private String uploadedByName;
    }

    /** Real file upload (multipart) */
    @Data @Builder
    public static class DocumentUploadRequest {
        private MultipartFile file;
        private String        name;
        private String        description;
        private String        frameworkIds;   // comma-separated e.g. "ISO27001,SOC2"
        private String        type;           // policy | procedure | evidence | other
        private String        uploadedByName;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE DTOs
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Document response — used by both old and new endpoints.
     *
     * New fields added for Tika extraction:
     *   extractionStatus  — SUCCESS | TRUNCATED | NO_TEXT | FAILED
     *   charCount         — number of characters extracted (0 if not extracted)
     *
     * Note: extractedText itself is NOT returned in the API response
     * (it can be hundreds of KB). It is stored in the DB for internal use only.
     */
    @Data @Builder
    public static class DocumentResponse {
        // Core
        private String  id;
        private String  name;
        private String  filename;
        private String  fileType;
        private Long    fileSize;
        private String  fileUrl;
        private String  description;
        private String  type;

        // Framework mapping
        private List<String> frameworkIds;
        private List<String> frameworks;     // old-format compat

        // Analysis
        private String  status;
        private Integer coverageScore;
        private String  uploadedByName;

        // ── NEW: Tika extraction info ──────────────────────────────────────
        /**
         * Result of the Tika extraction:
         *   SUCCESS   — text extracted, frameworks mapped from real content
         *   TRUNCATED — large file, text cut at 500k chars (still mapped correctly)
         *   NO_TEXT   — file parsed but empty (scanned/image PDF — needs OCR)
         *   FAILED    — Tika could not parse the file format
         *   null      — not yet attempted (queued document)
         */
        private String  extractionStatus;

        /**
         * Number of characters extracted.
         * Gives the user a sense of how much content was processed.
         * 0 = not extracted yet.
         */
        private int charCount;

        // Timestamps
        private LocalDateTime uploadedAt;
        private String        analyzedAt;    // formatted "yyyy-MM-dd"
        private String        size;          // formatted size string (old compat)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATS DTOs
    // ─────────────────────────────────────────────────────────────────────────

    /** Old-format stats (used by Dashboard) */
    @Data @Builder
    public static class DocumentStats {
        private int total;
        private int analyzed;
        private int processing;
        private int queued;
        private int error;
    }

    /** New-format stats (by document type) */
    @Data @Builder
    public static class DocumentStatsResponse {
        private int totalDocuments;
        private TypeBreakdown byType;

        @Data @Builder
        public static class TypeBreakdown {
            private int policy;
            private int procedure;
            private int evidence;
            private int other;
        }
    }

    /** Download URL response */
    @Data @Builder
    public static class DownloadUrlResponse {
        private String documentId;
        private String downloadUrl;
        private String filename;
    }
}
