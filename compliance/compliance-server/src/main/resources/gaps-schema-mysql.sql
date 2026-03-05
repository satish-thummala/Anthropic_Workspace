-- ============================================================================
-- GAP ANALYSIS - DATABASE SCHEMA (MySQL 8.0+)
-- Approach 1: Dedicated gaps table with full tracking
-- ============================================================================
-- Prerequisites: frameworks-schema-mysql.sql must have been run first
--   (controls, frameworks, users tables must exist)
-- ============================================================================

USE compliance_db;

-- ============================================================================
-- TABLE: gaps
-- ============================================================================

DROP TABLE IF EXISTS gaps;

CREATE TABLE gaps (
    id               CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
    control_id       CHAR(36)     NOT NULL,
    framework_id     CHAR(36)     NOT NULL,

    -- Gap classification
    gap_type         ENUM('missing_control', 'incomplete_evidence', 'outdated_policy')
                                  NOT NULL DEFAULT 'missing_control',
    severity         ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
                                  NOT NULL,

    -- Lifecycle status
    status           ENUM('open', 'in_progress', 'resolved', 'accepted_risk')
                                  NOT NULL DEFAULT 'open',

    -- Content
    description      TEXT,
    ai_suggestion    TEXT,
    remediation_notes TEXT,

    -- Assignment
    assigned_to      BIGINT       NULL,
    priority         INT          NOT NULL DEFAULT 0,

    -- Timeline
    identified_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_at      TIMESTAMP    NULL,
    started_at       TIMESTAMP    NULL,
    resolved_at      TIMESTAMP    NULL,
    target_date      DATE         NULL,

    -- Supporting metadata
    evidence_required JSON,
    related_documents JSON,

    -- Audit
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_gaps_control
        FOREIGN KEY (control_id)   REFERENCES controls(id)   ON DELETE CASCADE,
    CONSTRAINT fk_gaps_framework
        FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE,
    CONSTRAINT fk_gaps_user
        FOREIGN KEY (assigned_to)  REFERENCES users(id)      ON DELETE SET NULL,

    -- Performance indexes
    INDEX idx_gaps_control           (control_id),
    INDEX idx_gaps_framework         (framework_id),
    INDEX idx_gaps_severity          (severity),
    INDEX idx_gaps_status            (status),
    INDEX idx_gaps_assigned          (assigned_to),
    INDEX idx_gaps_framework_status  (framework_id, status),
    INDEX idx_gaps_severity_status   (severity, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- POPULATE: Auto-generate gaps from all uncovered controls
-- ============================================================================
-- Reads every control where is_covered = FALSE and creates one gap record.
-- Safe to re-run — the DELETE first ensures no duplicates.
-- ============================================================================

DELETE FROM gaps;   -- start fresh (safe on first run, idempotent on re-run)

INSERT INTO gaps (
    id,
    control_id,
    framework_id,
    gap_type,
    severity,
    status,
    description,
    ai_suggestion,
    evidence_required,
    identified_at
)
SELECT
    UUID()                                                       AS id,
    c.id                                                         AS control_id,
    c.framework_id                                               AS framework_id,
    'missing_control'                                            AS gap_type,
    c.severity                                                   AS severity,
    'open'                                                       AS status,
    CONCAT(
        'Control "', c.title, '" is not currently covered. ',
        COALESCE(c.description, '')
    )                                                            AS description,
    COALESCE(
        c.implementation_guidance,
        'Review and implement the control requirements.'
    )                                                            AS ai_suggestion,
    c.evidence_required                                          AS evidence_required,
    NOW()                                                        AS identified_at
FROM controls c
WHERE c.is_covered = FALSE;


-- ============================================================================
-- TRIGGER: Auto-manage gaps when a control's coverage changes
-- ============================================================================
-- When a control is toggled to uncovered → a new gap is created.
-- When a control is toggled to covered   → all open gaps for it are resolved.
-- This keeps the gaps table in sync with any coverage checkbox changes
-- made through the Frameworks → View Details page.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_after_control_coverage_change;

DELIMITER //

CREATE TRIGGER trg_after_control_coverage_change
AFTER UPDATE ON controls
FOR EACH ROW
BEGIN

    -- Control just became UNCOVERED → open a new gap
    IF OLD.is_covered = TRUE AND NEW.is_covered = FALSE THEN
        INSERT INTO gaps (
            id,
            control_id,
            framework_id,
            gap_type,
            severity,
            status,
            description,
            ai_suggestion,
            evidence_required,
            identified_at
        ) VALUES (
            UUID(),
            NEW.id,
            NEW.framework_id,
            'missing_control',
            NEW.severity,
            'open',
            CONCAT('Control "', NEW.title, '" coverage was removed.'),
            COALESCE(NEW.implementation_guidance, 'Review control requirements.'),
            NEW.evidence_required,
            NOW()
        );
    END IF;

    -- Control just became COVERED → resolve all open/in-progress gaps for it
    IF OLD.is_covered = FALSE AND NEW.is_covered = TRUE THEN
        UPDATE gaps
        SET    status      = 'resolved',
               resolved_at = NOW()
        WHERE  control_id  = NEW.id
          AND  status NOT IN ('resolved', 'accepted_risk');
    END IF;

END//

DELIMITER ;


-- ============================================================================
-- SAMPLE DATA: Simulate realistic gap workflow states
-- ============================================================================

-- Assign all CRITICAL gaps to the admin user
UPDATE gaps g
SET    g.assigned_to = (SELECT id FROM users WHERE email = 'admin@techcorp.com' LIMIT 1),
       g.assigned_at = NOW()
WHERE  g.severity    = 'CRITICAL';

-- Move HIGH severity gaps to in_progress
UPDATE gaps
SET    status     = 'in_progress',
       started_at = NOW()
WHERE  severity   = 'HIGH'
LIMIT  2;

-- Resolve one MEDIUM gap with a remediation note
UPDATE gaps
SET    status             = 'resolved',
       resolved_at        = NOW(),
       remediation_notes  = 'Control implemented and evidence documented in Security Policy v2.3.'
WHERE  severity           = 'MEDIUM'
LIMIT  1;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Full gap list (top 20, ordered by severity)
SELECT
    g.id,
    f.code       AS framework,
    c.code       AS control_code,
    c.title      AS control_title,
    g.severity,
    g.status,
    g.identified_at
FROM gaps g
JOIN controls  c ON g.control_id  = c.id
JOIN frameworks f ON g.framework_id = f.id
ORDER BY
    FIELD(g.severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'),
    f.code,
    c.display_order
LIMIT 20;

-- Summary by severity
SELECT
    severity,
    COUNT(*) AS total_gaps
FROM gaps
WHERE status != 'resolved'
GROUP BY severity
ORDER BY FIELD(severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- Summary by framework
SELECT
    f.code,
    f.name,
    COUNT(g.id)                                              AS total_gaps,
    SUM(CASE WHEN g.status = 'open'        THEN 1 ELSE 0 END) AS open_gaps,
    SUM(CASE WHEN g.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_gaps,
    SUM(CASE WHEN g.severity = 'CRITICAL'  THEN 1 ELSE 0 END) AS critical_gaps
FROM frameworks f
LEFT JOIN gaps g ON g.framework_id = f.id
GROUP BY f.code, f.name
ORDER BY total_gaps DESC;

-- Summary by status
SELECT
    status,
    COUNT(*) AS count
FROM gaps
GROUP BY status
ORDER BY FIELD(status, 'open', 'in_progress', 'accepted_risk', 'resolved');

-- Final success check
SELECT
    'gaps table ready'                                           AS result,
    COUNT(*)                                                     AS total_gaps,
    SUM(CASE WHEN status    = 'open'        THEN 1 ELSE 0 END)  AS open,
    SUM(CASE WHEN status    = 'in_progress' THEN 1 ELSE 0 END)  AS in_progress,
    SUM(CASE WHEN status    = 'resolved'    THEN 1 ELSE 0 END)  AS resolved,
    SUM(CASE WHEN severity  = 'CRITICAL'    THEN 1 ELSE 0 END)  AS critical
FROM gaps;

-- ============================================================================
-- DONE
-- ============================================================================
-- Next steps:
-- 1. Run this script in MySQL after frameworks-schema-mysql.sql
-- 2. Verify the final SELECT shows gaps populated correctly
-- 3. Move to the Java Gap entity + service + controller
-- ============================================================================
