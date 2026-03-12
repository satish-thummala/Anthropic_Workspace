package com.techcorp.compliance.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.techcorp.compliance.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary File Storage Implementation
 * 
 * Activated when: file.storage.type=cloudinary in application.properties
 * 
 * Setup:
 * 1. Sign up at https://cloudinary.com (free tier: 25GB)
 * 2. Get your credentials from dashboard
 * 3. Add to application.properties:
 * cloudinary.cloud-name=your_cloud_name
 * cloudinary.api-key=your_api_key
 * cloudinary.api-secret=your_api_secret
 */
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "cloudinary")
@RequiredArgsConstructor
@Slf4j
public class CloudinaryFileStorageService implements FileStorageService {

    private final Cloudinary cloudinary;

    @Override
    public String storeFile(MultipartFile file, String folder) throws IOException {
        log.info("Uploading file to Cloudinary: {} ({})", file.getOriginalFilename(), file.getSize());

        try {
            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder != null ? folder : "compliance-docs",
                            "resource_type", "auto", // auto-detect file type
                            "use_filename", true,
                            "unique_filename", true));

            String url = (String) uploadResult.get("secure_url");
            log.info("File uploaded successfully: {}", url);
            return url;

        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new IOException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) throws IOException {
        log.info("Deleting file from Cloudinary: {}", fileUrl);

        try {
            // Extract public_id from URL
            // URL format:
            // https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{public_id}
            String publicId = extractPublicId(fileUrl);

            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                        "resource_type", "raw"));
                log.info("File deleted successfully: {}", publicId);
            }
        } catch (IOException e) {
            log.error("Failed to delete file from Cloudinary", e);
            throw new IOException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getDownloadUrl(String fileUrl) {
        // Cloudinary URLs are already direct download URLs
        // But we can add flags for forced download
        if (fileUrl != null && fileUrl.contains("cloudinary.com")) {
            // Add fl_attachment flag to force download instead of inline display
            return fileUrl.replace("/upload/", "/upload/fl_attachment/");
        }
        return fileUrl;
    }

    @Override
    public boolean fileExists(String fileUrl) {
        try {
            String publicId = extractPublicId(fileUrl);
            if (publicId == null)
                return false;

            Map result = cloudinary.api().resource(publicId, ObjectUtils.asMap(
                    "resource_type", "raw"));
            return result != null;
        } catch (Exception e) {
            log.warn("File does not exist: {}", fileUrl);
            return false;
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example:
     * https://res.cloudinary.com/demo/raw/upload/v1234/compliance-docs/file.pdf
     * Returns: compliance-docs/file
     */
    private String extractPublicId(String url) {
        if (url == null || !url.contains("cloudinary.com")) {
            return null;
        }

        try {
            // Split URL and extract public_id
            String[] parts = url.split("/upload/");
            if (parts.length < 2)
                return null;

            String afterUpload = parts[1];
            // Remove version (v1234/)
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", "");
            // Remove file extension
            return withoutVersion.substring(0, withoutVersion.lastIndexOf('.'));
        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", url, e);
            return null;
        }
    }
}
