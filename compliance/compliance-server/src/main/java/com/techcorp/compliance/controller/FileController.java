package com.techcorp.compliance.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * FileController
 * 
 * Serves uploaded files for preview and download.
 * 
 * Endpoints:
 *   GET /files/{folder}/{filename} - Serve file for preview/download
 */
@RestController
@RequestMapping("/files")
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FileController {

    @Value("${file.storage.local.base-path:./uploads}")
    private String uploadPath;

    /**
     * Serve a file for preview or download.
     * 
     * GET /files/documents/policies/12345.pdf
     * GET /files/documents/policies/12345.pdf?download=true
     * 
     * @param folder Folder path (e.g., "documents/policies")
     * @param filename File name
     * @param download If true, force download; if false, inline preview
     * @return File content
     */
    @GetMapping("/{folder1}/{folder2}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String folder1,
            @PathVariable String folder2,
            @PathVariable String filename,
            @RequestParam(required = false, defaultValue = "false") boolean download) {
        
        try {
            // Build file path
            Path filePath = Paths.get(uploadPath)
                    .resolve(folder1)
                    .resolve(folder2)
                    .resolve(filename)
                    .normalize();

            log.info("Serving file: {}", filePath);

            // Load file as resource
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.error("File not found or not readable: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = determineContentType(filename);

            // Build response headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));

            if (download) {
                // Force download
                headers.setContentDispositionFormData("attachment", filename);
            } else {
                // Inline preview (browser will display if possible)
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"");
            }

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error serving file: {}/{}/{}", folder1, folder2, filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Determine content type from filename.
     */
    private String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lower.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (lower.endsWith(".doc")) {
            return "application/msword";
        } else if (lower.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else if (lower.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        } else if (lower.endsWith(".pptx")) {
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        } else if (lower.endsWith(".ppt")) {
            return "application/vnd.ms-powerpoint";
        } else if (lower.endsWith(".txt")) {
            return "text/plain";
        } else if (lower.endsWith(".csv")) {
            return "text/csv";
        } else {
            return "application/octet-stream";
        }
    }
}
