-- ============================================================================
-- MIGRATION 14: Widen audit_logs.action column
-- ============================================================================
-- Widens action from VARCHAR(40) to VARCHAR(60) for new incident action names.
-- Safe to run even if already wide enough.
-- ============================================================================

USE compliance_db;

ALTER TABLE audit_logs
    MODIFY COLUMN action VARCHAR(80) NOT NULL
        COMMENT 'Event type — see AuditLog.Action enum';

SELECT 'audit_logs.action widened to VARCHAR(80)' AS status;
