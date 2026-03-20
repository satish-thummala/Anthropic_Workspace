-- ============================================================================
-- MIGRATION 15: Employee Portal — SOP Tasks & Acknowledgements
-- ============================================================================
-- Creates tables for:
--   sop_documents  — policy/SOP documents assigned to employees
--   sop_tasks      — individual assignments (one task per employee per SOP)
--   task_comments  — notes on tasks from managers or employees
--
-- Also seeds three demo employee users.
-- Run after: 14-migration-widen-audit-action.sql
-- ============================================================================

USE compliance_db;

-- ── sop_documents ─────────────────────────────────────────────────────────────
-- The policy or SOP document that employees are asked to acknowledge.

CREATE TABLE IF NOT EXISTS sop_documents (
    id              CHAR(36)      NOT NULL,
    title           VARCHAR(500)  NOT NULL,
    description     TEXT          NULL,
    version         VARCHAR(20)   NOT NULL DEFAULT '1.0',
    category        ENUM(
                      'security_policy',
                      'data_protection',
                      'acceptable_use',
                      'incident_response',
                      'access_control',
                      'business_continuity',
                      'hr_policy',
                      'other'
                    ) NOT NULL DEFAULT 'other',
    content         LONGTEXT      NULL COMMENT 'Full policy text (Markdown)',
    framework_codes VARCHAR(200)  NULL COMMENT 'e.g. ISO27001,GDPR',
    due_days        INT           NOT NULL DEFAULT 7
                    COMMENT 'Days employees have to acknowledge after assignment',
    requires_approval BOOLEAN     NOT NULL DEFAULT FALSE
                    COMMENT 'TRUE = employee must approve, not just acknowledge',
    created_by_id   BIGINT        NULL,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_sop_category (category),
    INDEX idx_sop_active   (is_active),
    CONSTRAINT fk_sop_created_by FOREIGN KEY (created_by_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── sop_tasks ──────────────────────────────────────────────────────────────────
-- One row per (employee, SOP document) assignment.

CREATE TABLE IF NOT EXISTS sop_tasks (
    id              CHAR(36)      NOT NULL,
    sop_id          CHAR(36)      NOT NULL,
    assigned_to_id  BIGINT        NOT NULL,
    assigned_by_id  BIGINT        NULL,

    status          ENUM('pending','acknowledged','approved','rejected','overdue')
                    NOT NULL DEFAULT 'pending',
    task_type       ENUM('acknowledge','approve','complete_training')
                    NOT NULL DEFAULT 'acknowledge',

    -- Acknowledgement / sign-off
    signed_at       DATETIME      NULL,
    signature_note  TEXT          NULL COMMENT 'Optional note from employee at sign-off',

    -- Rejection (for approval tasks)
    rejection_reason TEXT         NULL,

    -- Dates
    due_date        DATE          NOT NULL,
    assigned_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_task_assigned_to (assigned_to_id),
    INDEX idx_task_sop         (sop_id),
    INDEX idx_task_status      (status),
    INDEX idx_task_due         (due_date),
    CONSTRAINT fk_task_sop         FOREIGN KEY (sop_id)
        REFERENCES sop_documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assigned_to FOREIGN KEY (assigned_to_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assigned_by FOREIGN KEY (assigned_by_id)
        REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_task_employee_sop (sop_id, assigned_to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── task_comments ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_comments (
    id          CHAR(36)     NOT NULL,
    task_id     CHAR(36)     NOT NULL,
    author_id   BIGINT       NULL,
    author_name VARCHAR(100) NOT NULL,
    content     TEXT         NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_comment_task (task_id),
    CONSTRAINT fk_comment_task FOREIGN KEY (task_id)
        REFERENCES sop_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed employee users ────────────────────────────────────────────────────────
-- Passwords are BCrypt hashes of the plain-text passwords shown below.
-- Plain: employee1@techcorp.com / Employee@123
-- Plain: employee2@techcorp.com / Employee@123
-- Plain: employee3@techcorp.com / Employee@123
-- The DataInitializer will re-hash these on startup — just insert the rows.

INSERT IGNORE INTO users (email, password, name, role, organization, avatar, enabled, created_at, updated_at)
VALUES
  ('employee1@techcorp.com', '$2a$12$placeholder', 'Alex Turner',    'Employee', 'Nirvahak Inc.', 'AT', TRUE, NOW(), NOW()),
  ('employee2@techcorp.com', '$2a$12$placeholder', 'Priya Sharma',   'Employee', 'Nirvahak Inc.', 'PS', TRUE, NOW(), NOW()),
  ('employee3@techcorp.com', '$2a$12$placeholder', 'Marcus Johnson', 'Employee', 'Nirvahak Inc.', 'MJ', TRUE, NOW(), NOW());

SELECT 'SOP tables created' AS status;
