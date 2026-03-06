package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Document;
import com.techcorp.compliance.entity.Document.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    /** All documents newest-first — main list query. */
    List<Document> findAllByOrderByUploadedAtDesc();

    /** Keyword search on document name (case-insensitive). */
    @Query("SELECT d FROM Document d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :kw, '%')) ORDER BY d.uploadedAt DESC")
    List<Document> searchByName(@Param("kw") String keyword);

    /** Count by status — used by /documents/stats. */
    long countByStatus(Status status);
}
