-- ============================================================================
-- MIGRATION 9: Add Apache Tika text extraction columns to documents table
-- ============================================================================
-- Run after: 8-migration-add-file-columns.sql
-- ============================================================================

-- Full plain text extracted from document by Apache Tika.
-- MEDIUMTEXT supports up to 16MB — enough for any policy document.
ALTER TABLE documents
    ADD COLUMN extracted_text MEDIUMTEXT NULL
        COMMENT 'Plain text extracted by Apache Tika (PDF, DOCX, XLSX, TXT, etc.)';

-- Result of the last extraction attempt.
-- Values: SUCCESS | TRUNCATED | NO_TEXT | FAILED
ALTER TABLE documents
    ADD COLUMN extraction_status VARCHAR(20) NULL
        COMMENT 'Tika extraction result: SUCCESS | TRUNCATED | NO_TEXT | FAILED';

-- Index for filtering docs by extraction status
-- (e.g. find all docs that failed extraction for retry)
CREATE INDEX idx_docs_extraction_status
    ON documents (extraction_status);

-- ── Back-fill existing rows ───────────────────────────────────────────────────
-- Existing documents have no extracted text yet.
-- Mark them NULL/NULL so the UI shows them as "queued for analysis".
-- The user can click Analyze to trigger extraction.
UPDATE documents
SET extraction_status = NULL
WHERE extracted_text IS NULL;

-- ============================================================================
-- VERIFICATION (optional — run to confirm columns exist)
-- ============================================================================
-- SHOW COLUMNS FROM documents LIKE 'extracted%';
-- Expected output:
--   extracted_text    | mediumtext | YES | ... | NULL |
--   extraction_status | varchar(20)| YES | MUL | NULL |

-- Fix file_type (too short)
ALTER TABLE documents 
MODIFY COLUMN file_type VARCHAR(255);

-- Make sure other columns are correct size
ALTER TABLE documents 
MODIFY COLUMN file_url VARCHAR(1000);

ALTER TABLE documents 
MODIFY COLUMN filename VARCHAR(500);

ALTER TABLE documents 
MODIFY COLUMN description VARCHAR(2000);

ALTER TABLE documents 
MODIFY COLUMN framework_ids VARCHAR(500);

ALTER TABLE documents 
MODIFY COLUMN extracted_text LONGTEXT;