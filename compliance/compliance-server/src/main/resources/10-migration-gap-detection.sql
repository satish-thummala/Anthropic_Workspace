-- ══════════════════════════════════════════════════════════════════════════
-- GAP DETECTION - DATABASE MIGRATION
-- ══════════════════════════════════════════════════════════════════════════

USE compliance_db;

-- Add auto-detection fields to gaps table
ALTER TABLE gaps 
ADD COLUMN auto_detected BOOLEAN DEFAULT FALSE
COMMENT 'True if gap was auto-detected from document analysis';

ALTER TABLE gaps 
ADD COLUMN detected_from_document_id VARCHAR(255)
COMMENT 'Document ID that triggered auto-detection';

ALTER TABLE gaps 
ADD COLUMN confidence_score INT
COMMENT 'Confidence score (0-100) for auto-detected gaps';

ALTER TABLE gaps 
ADD COLUMN matched_keywords TEXT
COMMENT 'JSON array of keywords that were matched';

-- Add index for auto-detected gaps
CREATE INDEX idx_gaps_auto_detected 
ON gaps(auto_detected, status);

CREATE INDEX idx_gaps_document 
ON gaps(detected_from_document_id);

SELECT 'Migration completed successfully!' AS status;

CREATE TEMPORARY TABLE gaps_to_keep AS
SELECT control_id, MIN(id) as keep_id
FROM gaps GROUP BY control_id;
 
DELETE FROM gaps
WHERE id NOT IN (SELECT keep_id FROM gaps_to_keep);
