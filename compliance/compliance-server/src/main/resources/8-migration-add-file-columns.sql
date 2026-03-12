-- ============================================================================
-- MIGRATION: Add Real File Upload Fields to Documents Table (MySQL VERSION)
-- ============================================================================

-- Add new columns for real file upload
ALTER TABLE documents ADD COLUMN filename VARCHAR(500) NULL;
ALTER TABLE documents ADD COLUMN file_url VARCHAR(1000) NULL;
ALTER TABLE documents ADD COLUMN description VARCHAR(2000) NULL;
ALTER TABLE documents ADD COLUMN type VARCHAR(50) NULL;
ALTER TABLE documents ADD COLUMN framework_ids VARCHAR(500) NULL;

-- Update file_type column to allow longer MIME types
ALTER TABLE documents MODIFY COLUMN file_type VARCHAR(50) NOT NULL;

-- Add index on type column for faster filtering
CREATE INDEX idx_docs_type ON documents(type);

-- Set default values for existing records
UPDATE documents SET type = 'other' WHERE type IS NULL;
UPDATE documents SET filename = name WHERE filename IS NULL;
