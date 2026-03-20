package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.SopDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SopDocumentRepository extends JpaRepository<SopDocument, String> {
    List<SopDocument> findByIsActiveTrueOrderByCreatedAtDesc();
    List<SopDocument> findAllByOrderByCreatedAtDesc();
}
