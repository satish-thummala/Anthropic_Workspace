package com.techcorp.compliance.service;

import com.techcorp.compliance.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local File Storage Implementation
 * 
 * Activated when: file.storage.type=local in application.properties
 * 
 * Setup:
 * Add to application.properties:
 * file.storage.local.base-path=./uploads
 * file.storage.local.base-url=http://localhost:8080/files
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    @Value("${file.storage.local.base-path:./uploads}")
    private String basePath;

    @Value("${file.storage.local.base-url:http://localhost:8080/files}")
    private String baseUrl;

    @Override
    public String storeFile(MultipartFile file, String folder) throws IOException {
        log.info("Storing file locally: {} ({})", file.getOriginalFilename(), file.getSize());

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(basePath, folder != null ? folder : "documents");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename to avoid conflicts
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return URL
        String relativeUrl = (folder != null ? folder + "/" : "documents/") + uniqueFilename;
        String fullUrl = baseUrl + "/" + relativeUrl;

        log.info("File stored successfully: {}", fullUrl);
        return fullUrl;
    }

    @Override
    public void deleteFile(String fileUrl) throws IOException {
        log.info("Deleting file: {}", fileUrl);

        try {
            Path filePath = urlToPath(fileUrl);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted successfully: {}", filePath);
            } else {
                log.warn("File not found for deletion: {}", filePath);
            }
        } catch (Exception e) {
            log.error("Failed to delete file", e);
            throw new IOException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getDownloadUrl(String fileUrl) {
        // For local storage, just return the URL
        // The controller will handle serving the file
        return fileUrl;
    }

    @Override
    public boolean fileExists(String fileUrl) {
        try {
            Path filePath = urlToPath(fileUrl);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Convert URL to filesystem path
     * Example: http://localhost:8080/files/documents/abc-123.pdf ->
     * ./uploads/documents/abc-123.pdf
     */
    private Path urlToPath(String fileUrl) {
        if (fileUrl == null) {
            throw new IllegalArgumentException("File URL cannot be null");
        }

        // Remove base URL to get relative path
        String relativePath = fileUrl.replace(baseUrl + "/", "");
        return Paths.get(basePath, relativePath);
    }

    /**
     * Get file extension including the dot
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }
}
