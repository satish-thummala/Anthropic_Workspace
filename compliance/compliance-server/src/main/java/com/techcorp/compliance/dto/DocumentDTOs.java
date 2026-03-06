package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

public class DocumentDTOs {

    // ── RESPONSE ──────────────────────────────────────────────────────────────

    /**
     * Returned by every endpoint that returns a document.
     * Field names match the existing React ComplianceDocument interface
     * so the frontend needs minimal changes.
     */
    @Data @Builder
    public static class DocumentResponse {
        private String       id;
        private String       name;
        private String       type;           // matches React: doc.type
        private String       size;           // matches React: doc.size  e.g. "2.4 MB"
        private String       status;         // queued | processing | analyzed | error
        private Integer      coverageScore;  // null until analyzed
        private List<String> frameworks;     // ["ISO27001","SOC2"]
        private String       uploadedByName;
        private String       uploadedAt;     // "2026-02-14"
        private String       analyzedAt;     // null if not yet analyzed
    }

    /**
     * GET /documents/stats — powers the Dashboard "Documents Ingested" card.
     */
    @Data @Builder
    public static class DocumentStats {
        private int total;
        private int analyzed;
        private int processing;
        private int queued;
        private int error;
    }

    // ── REQUESTS ──────────────────────────────────────────────────────────────

    /**
     * POST /documents/upload
     * Metadata-only upload — no actual file bytes (same Option-B pattern as mapping).
     * React sends this when a user drops a file.
     */
    @Data
    public static class UploadRequest {
        private String name;            // original filename e.g. "Security Policy.pdf"
        private long   fileSizeBytes;
        private String fileSizeLabel;   // pre-formatted: "2.4 MB"
        private String uploadedByName;
    }
}
