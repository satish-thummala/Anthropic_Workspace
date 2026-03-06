-- ============================================================================
-- DOCUMENT INGESTION — MySQL Schema
-- ============================================================================
-- Run order: schema.sql → frameworks-schema-mysql.sql → gaps-schema-mysql.sql
--            → risk-schema-mysql.sql → documents-schema-mysql.sql (this file)
-- ============================================================================

USE compliance_db;

-- ── Drop in safe order (join table first) ────────────────────────────────────
DROP TABLE IF EXISTS document_framework_mappings;
DROP TABLE IF EXISTS documents;

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE TABLE documents (
    id               CHAR(36)     NOT NULL,
    name             VARCHAR(500) NOT NULL,
    file_type        VARCHAR(20)  NOT NULL,           -- PDF | DOCX | XLSX | TXT
    file_size_bytes  BIGINT       NOT NULL DEFAULT 0,
    file_size_label  VARCHAR(30)  NOT NULL DEFAULT '', -- "2.4 MB" pre-formatted for UI
    status           ENUM('queued','processing','analyzed','error')
                                  NOT NULL DEFAULT 'queued',
    coverage_score   INT          NULL,               -- 0-100, set after analysis
    uploaded_by_name VARCHAR(100) NULL,
    uploaded_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analyzed_at      DATETIME     NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_docs_status      (status),
    INDEX idx_docs_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── document_framework_mappings ───────────────────────────────────────────────
-- One row per document-framework pair (a doc can cover multiple frameworks).
CREATE TABLE document_framework_mappings (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    document_id    CHAR(36)    NOT NULL,
    framework_code VARCHAR(50) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_doc_fw (document_id, framework_code),
    CONSTRAINT fk_dfm_document
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SEED: 5 documents matching the frontend INITIAL_DOCUMENTS mock exactly
-- Using stable UUIDs so re-runs are idempotent.
-- ============================================================================

INSERT INTO documents
    (id, name, file_type, file_size_bytes, file_size_label,
     status, coverage_score, uploaded_by_name, uploaded_at, analyzed_at)
VALUES
    ('d0c00001-0000-0000-0000-000000000001',
     'Information Security Policy.docx', 'DOCX', 2516582, '2.4 MB',
     'analyzed', 82, 'Sarah Chen', '2026-02-14 09:00:00', '2026-02-14 09:05:00'),

    ('d0c00001-0000-0000-0000-000000000002',
     'Data Protection Policy.pdf', 'PDF', 1153434, '1.1 MB',
     'analyzed', 91, 'Sarah Chen', '2026-02-13 14:00:00', '2026-02-13 14:04:00'),

    ('d0c00001-0000-0000-0000-000000000003',
     'HR Employee Handbook.pdf', 'PDF', 5452595, '5.2 MB',
     'processing', NULL, 'James Patel', '2026-02-17 11:00:00', NULL),

    ('d0c00001-0000-0000-0000-000000000004',
     'IT Security Procedures.docx', 'DOCX', 943718, '0.9 MB',
     'analyzed', 67, 'Sarah Chen', '2026-02-10 10:00:00', '2026-02-10 10:06:00'),

    ('d0c00001-0000-0000-0000-000000000005',
     'Business Continuity Plan.pdf', 'PDF', 3459277, '3.3 MB',
     'queued', NULL, 'James Patel', '2026-02-17 16:00:00', NULL);


-- ── Framework mappings for analyzed documents ─────────────────────────────────
INSERT INTO document_framework_mappings (document_id, framework_code) VALUES
    ('d0c00001-0000-0000-0000-000000000001', 'ISO27001'),
    ('d0c00001-0000-0000-0000-000000000001', 'SOC2'),
    ('d0c00001-0000-0000-0000-000000000002', 'GDPR'),
    ('d0c00001-0000-0000-0000-000000000004', 'ISO27001'),
    ('d0c00001-0000-0000-0000-000000000004', 'HIPAA');


-- ============================================================================
-- VERIFY — should show 5 rows
-- ============================================================================
SELECT
    d.name,
    d.file_type   AS type,
    d.file_size_label AS size,
    d.status,
    d.coverage_score,
    GROUP_CONCAT(m.framework_code ORDER BY m.framework_code SEPARATOR ', ') AS frameworks
FROM documents d
LEFT JOIN document_framework_mappings m ON m.document_id = d.id
GROUP BY d.id
ORDER BY d.uploaded_at DESC;
