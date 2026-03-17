-- ============================================================================
-- MIGRATION 12: Audit Trail
-- ============================================================================
-- Creates the audit_logs table — immutable event log for every significant
-- user action across the platform.
--
-- Run after: 11-migration-policy-automation.sql
-- ============================================================================

USE compliance_db;

CREATE TABLE IF NOT EXISTS audit_logs (
    id              CHAR(36)     NOT NULL,

    -- Who
    user_email      VARCHAR(150) NULL
        COMMENT 'Email of the user who triggered the event (NULL = system)',
    user_name       VARCHAR(100) NULL
        COMMENT 'Display name at time of event',

    -- What
    action          VARCHAR(40)  NOT NULL
        COMMENT 'EVENT TYPE: USER_LOGIN | GAP_STATUS_CHANGED | DOCUMENT_UPLOADED | etc.',

    -- Which entity
    entity_type     VARCHAR(50)  NULL
        COMMENT 'Gap | Document | Policy | Report | Auth | Risk | System',
    entity_id       VARCHAR(100) NULL
        COMMENT 'UUID or ID of the affected record',
    entity_name     VARCHAR(500) NULL
        COMMENT 'Human-readable name at time of event',

    -- Detail
    description     VARCHAR(1000) NULL
        COMMENT 'What happened in plain English',
    old_value       VARCHAR(500) NULL
        COMMENT 'Previous value for update events',
    new_value       VARCHAR(500) NULL
        COMMENT 'New value for update events',

    -- Outcome
    outcome         VARCHAR(10)  NOT NULL DEFAULT 'SUCCESS'
        COMMENT 'SUCCESS | FAILURE',
    error_message   VARCHAR(500) NULL
        COMMENT 'Error detail when outcome = FAILURE',

    -- Context
    ip_address      VARCHAR(45)  NULL
        COMMENT 'Client IP (supports IPv6)',
    metadata        VARCHAR(1000) NULL
        COMMENT 'Extra context as key=value or JSON string',

    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Indexes for common filter patterns in the UI
    INDEX idx_audit_user        (user_email),
    INDEX idx_audit_action      (action),
    INDEX idx_audit_entity      (entity_type, entity_id),
    INDEX idx_audit_created_at  (created_at),
    INDEX idx_audit_outcome     (outcome)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail — never update or delete rows';


-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'audit_logs table created' AS status,
       COUNT(*)                    AS row_count
FROM audit_logs;
