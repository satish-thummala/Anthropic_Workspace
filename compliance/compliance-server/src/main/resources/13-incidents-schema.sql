-- ============================================================================
-- MIGRATION 13: Incident Management
-- ============================================================================
-- Creates the incidents table for tracking security and compliance incidents.
-- Run after: 12-migration-audit-trail.sql
-- ============================================================================

USE compliance_db;

CREATE TABLE IF NOT EXISTS incidents (
    id                    CHAR(36)      NOT NULL,

    -- Classification
    title                 VARCHAR(500)  NOT NULL,
    description           TEXT          NULL,
    severity              ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
    incident_type         ENUM(
                            'data_breach','unauthorised_access','malware',
                            'phishing','policy_violation','system_outage',
                            'third_party_breach','insider_threat','other'
                          ) NOT NULL DEFAULT 'other',
    status                ENUM('open','investigating','contained','resolved','closed')
                          NOT NULL DEFAULT 'open',

    -- Impact
    affected_systems      VARCHAR(1000) NULL,
    affected_frameworks   VARCHAR(200)  NULL,
    personal_data_involved BOOLEAN      NOT NULL DEFAULT FALSE,
    records_affected      INT           NULL,

    -- Investigation
    root_cause            TEXT          NULL,
    corrective_actions    TEXT          NULL,
    lessons_learned       TEXT          NULL,
    ai_narrative          LONGTEXT      NULL,

    -- People
    reported_by_id        BIGINT        NULL,
    assigned_to_id        BIGINT        NULL,

    -- Regulatory
    regulator_notified    BOOLEAN       NOT NULL DEFAULT FALSE,
    regulator_notified_at DATETIME      NULL,
    individuals_notified  BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Timestamps
    detected_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contained_at          DATETIME      NULL,
    resolved_at           DATETIME      NULL,
    closed_at             DATETIME      NULL,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_incident_status   (status),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_type     (incident_type),
    INDEX idx_incident_created  (created_at),
    INDEX idx_incident_personal (personal_data_involved),

    CONSTRAINT fk_incident_reported_by FOREIGN KEY (reported_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_incident_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'incidents table created' AS status, COUNT(*) AS row_count FROM incidents;
