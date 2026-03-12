package com.techcorp.compliance.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * File Storage Service Interface
 * Allows switching between Cloudinary, S3, MinIO, or Local storage
 */
public interface FileStorageService {
    
    /**
     * Store a file and return its URL/path
     * @param file The file to store
     * @param folder Optional folder/prefix (e.g., "documents/policies")
     * @return URL or path to the stored file
     */
    String storeFile(MultipartFile file, String folder) throws IOException;
    
    /**
     * Delete a file
     * @param fileUrl The URL/path returned from storeFile
     */
    void deleteFile(String fileUrl) throws IOException;
    
    /**
     * Get download URL for a file
     * @param fileUrl The URL/path of the file
     * @return Direct download URL
     */
    String getDownloadUrl(String fileUrl);
    
    /**
     * Check if a file exists
     * @param fileUrl The URL/path of the file
     * @return true if exists
     */
    boolean fileExists(String fileUrl);
}
