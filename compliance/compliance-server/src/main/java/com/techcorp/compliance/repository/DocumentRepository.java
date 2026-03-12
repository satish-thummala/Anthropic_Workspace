package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Document;
import com.techcorp.compliance.entity.Document.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Document Repository
 * 
 * Provides database access for Document entities
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    // ═════════════════════════════════════════════════════════════════════════
    // OLD METHODS (for backward compatibility)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Search documents by name (case-insensitive)
     * Used by: DocumentService.getAll(String keyword)
     */
    @Query("SELECT d FROM Document d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Document> searchByName(@Param("keyword") String keyword);

    /**
     * Find all documents ordered by upload date descending
     * Used by: DocumentService.getAll(String keyword)
     */
    List<Document> findAllByOrderByUploadedAtDesc();

    /**
     * Count documents by status
     * Used by: DocumentService.getStats()
     */
    long countByStatus(Status status);

    // ═════════════════════════════════════════════════════════════════════════
    // NEW METHODS (for file upload features)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Find documents by framework
     * @param framework Framework code (e.g., "ISO27001")
     * @return List of documents
     */
    List<Document> findByFrameworkIdsContaining(String framework);

    /**
     * Find documents by type
     * @param type Document type (policy, procedure, evidence, other)
     * @return List of documents
     */
    List<Document> findByType(String type);

    /**
     * Find documents by framework and type
     * @param framework Framework code
     * @param type Document type
     * @return List of documents
     */
    List<Document> findByFrameworkIdsContainingAndType(String framework, String type);

    /**
     * Count documents by type
     * @param type Document type
     * @return Count
     */
    long countByType(String type);
}
