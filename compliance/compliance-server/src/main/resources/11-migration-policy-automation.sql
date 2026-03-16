-- ============================================================================
-- MIGRATION 11: Policy Automation — Phase 2 Persistence
-- ============================================================================
-- Creates the generated_policies table to track every policy the AI generates.
-- Linked to the documents table when a policy is saved via "Save to Docs".
--
-- Run after: 10-migration-gap-detection.sql
-- ============================================================================

USE compliance_db;

-- ── generated_policies ───────────────────────────────────────────────────────
-- Records every policy generation event:
--   - What was generated (type, framework, org)
--   - Who generated it and when
--   - Which engine was used (groq or local fallback)
--   - Whether it was saved to Documents and which document record it became
--   - The full markdown content (so history is browsable without re-generating)

CREATE TABLE IF NOT EXISTS generated_policies (
    id                  CHAR(36)      NOT NULL,

    -- Policy classification
    policy_type         VARCHAR(50)   NOT NULL
        COMMENT 'access_control | incident_response | data_protection | acceptable_use | business_continuity',

    policy_type_label   VARCHAR(200)  NOT NULL
        COMMENT 'Human-readable label e.g. "Access Control Policy"',

    title               VARCHAR(500)  NOT NULL
        COMMENT 'Full document title e.g. "Access Control Policy — ISO/IEC 27001 | Acme Corp"',

    -- Framework & org context
    framework_code      VARCHAR(50)   NULL
        COMMENT 'ISO27001 | SOC2 | GDPR | HIPAA | NULL if general',

    framework_name      VARCHAR(200)  NULL
        COMMENT 'Full framework name e.g. "ISO/IEC 27001"',

    org_name            VARCHAR(200)  NOT NULL DEFAULT 'Your Organisation',

    -- Generated content (full Markdown)
    content             LONGTEXT      NOT NULL
        COMMENT 'Complete policy document in Markdown format',

    -- Generation metadata
    engine              VARCHAR(20)   NOT NULL DEFAULT 'local'
        COMMENT 'groq | local — which engine produced the content',

    generation_ms       INT           NOT NULL DEFAULT 0
        COMMENT 'Time taken to generate in milliseconds',

    generated_by_name   VARCHAR(100)  NULL
        COMMENT 'Name of the user who triggered generation',

    -- Document loop — set when user clicks "Save to Docs"
    saved_to_documents  BOOLEAN       NOT NULL DEFAULT FALSE
        COMMENT 'TRUE once the policy has been saved to the documents table',

    document_id         CHAR(36)      NULL
        COMMENT 'FK to documents.id — set when saved_to_documents = TRUE',

    -- Timestamps
    generated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saved_at            DATETIME      NULL
        COMMENT 'When the policy was saved to documents',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Fast lookups
    INDEX idx_genpol_type         (policy_type),
    INDEX idx_genpol_framework    (framework_code),
    INDEX idx_genpol_saved        (saved_to_documents),
    INDEX idx_genpol_generated_at (generated_at),
    INDEX idx_genpol_document     (document_id),

    -- Soft FK to documents (no hard constraint — document may be deleted independently)
    CONSTRAINT fk_genpol_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT
    'generated_policies table created' AS status,
    COUNT(*)                            AS row_count
FROM generated_policies;
