package com.techcorp.compliance.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

public class DocumentDTOs {

    // ═════════════════════════════════════════════════════════════════════════
    // OLD DTOs (for backward compatibility with existing code)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * OLD: Metadata-only upload request
     * Used by: DocumentService.upload(UploadRequest req)
     */
    @Data
    @Builder
    public static class UploadRequest {
        private String name;
        private Long fileSizeBytes;
        private String fileSizeLabel;
        private String uploadedByName;
    }

    /**
     * OLD: Document statistics
     * Used by: DocumentService.getStats()
     */
    @Data
    @Builder
    public static class DocumentStats {
        private int total;
        private int analyzed;
        private int processing;
        private int queued;
        private int error;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NEW DTOs (for real file upload)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * NEW: Real file upload request (with actual file)
     * Used by: DocumentService.uploadDocument(DocumentUploadRequest request)
     */
    @Data
    @Builder
    public static class DocumentUploadRequest {
        private MultipartFile file;
        private String name;
        private String description;
        private String frameworkIds; // Comma-separated (e.g., "ISO27001,SOC2")
        private String type; // policy, procedure, evidence, other
    }

    /**
     * Document Response (used by both old and new methods)
     */
    @Data
    @Builder
    public static class DocumentResponse {
        // Basic fields
        private String id;
        private String name;
        private String filename;
        private String fileType;
        private Long fileSize;
        private String fileUrl;
        private String description;
        private String type;
        
        // Framework mapping
        private List<String> frameworkIds;
        private List<String> frameworks; // OLD format compatibility
        
        // Status fields (for old format)
        private String status;
        private Integer coverageScore;
        private String uploadedByName;
        
        // Timestamps
        private LocalDateTime uploadedAt;
        private String analyzedAt; // OLD format (String)
        
        // Display fields (for old format)
        private String size; // Formatted size string
    }

    /**
     * NEW: Download URL Response
     */
    @Data
    @Builder
    public static class DownloadUrlResponse {
        private String documentId;
        private String downloadUrl;
        private String filename;
    }

    /**
     * NEW: Document Stats Response (new format with type breakdown)
     */
    @Data
    @Builder
    public static class DocumentStatsResponse {
        private int totalDocuments;
        private TypeBreakdown byType;

        @Data
        @Builder
        public static class TypeBreakdown {
            private int policy;
            private int procedure;
            private int evidence;
            private int other;
        }
    }
}
