-- ============================================================================
-- RISK SCORING - DATABASE SCHEMA (MySQL 8.0+)
-- ============================================================================
-- Prerequisites: schema.sql + frameworks-schema-mysql.sql + gaps-schema-mysql.sql
-- must have been run first.
-- ============================================================================

USE compliance_db;

DROP TABLE IF EXISTS risk_snapshots;

CREATE TABLE risk_snapshots (
    id                   CHAR(36)      PRIMARY KEY DEFAULT (UUID()),

    -- Computed score (0–100)
    score                INT           NOT NULL,
    risk_level           VARCHAR(20)   NOT NULL,   -- LOW | MEDIUM | HIGH | CRITICAL
    maturity_label       VARCHAR(50)   NOT NULL,   -- Initial | Developing | Establishing | Established | Optimizing

    -- Gap counts at the time of calculation (non-resolved only)
    critical_gaps        INT           NOT NULL DEFAULT 0,
    high_gaps            INT           NOT NULL DEFAULT 0,
    medium_gaps          INT           NOT NULL DEFAULT 0,
    low_gaps             INT           NOT NULL DEFAULT 0,

    -- Coverage snapshot
    total_controls       INT           NOT NULL DEFAULT 0,
    covered_controls     INT           NOT NULL DEFAULT 0,
    coverage_percentage  INT           NOT NULL DEFAULT 0,

    -- How many frameworks were below 70% at calculation time
    frameworks_below_70  INT           NOT NULL DEFAULT 0,

    -- Optional free-text note (e.g. "After Q1 remediation sprint")
    notes                TEXT,

    calculated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_risk_calculated_at (calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SEED: Insert historical snapshots so the trend chart has data on first load
-- These mirror the RISK_HISTORY mock from the React frontend.
-- ============================================================================

INSERT INTO risk_snapshots
    (id, score, risk_level, maturity_label, critical_gaps, high_gaps, medium_gaps, low_gaps,
     total_controls, covered_controls, coverage_percentage, frameworks_below_70, notes, calculated_at)
VALUES
    (UUID(), 38, 'HIGH',   'Initial',      4, 6, 8, 5, 47, 18, 38, 4, 'Baseline — Aug 2025',        '2025-08-01 09:00:00'),
    (UUID(), 42, 'HIGH',   'Initial',      4, 5, 8, 5, 47, 20, 43, 4, 'Sep 2025 snapshot',          '2025-09-01 09:00:00'),
    (UUID(), 45, 'HIGH',   'Developing',   3, 5, 7, 4, 47, 21, 45, 3, 'Oct 2025 snapshot',          '2025-10-01 09:00:00'),
    (UUID(), 51, 'MEDIUM', 'Developing',   3, 4, 6, 4, 47, 24, 51, 3, 'Nov 2025 snapshot',          '2025-11-01 09:00:00'),
    (UUID(), 56, 'MEDIUM', 'Developing',   2, 4, 5, 3, 47, 26, 55, 2, 'Dec 2025 snapshot',          '2025-12-01 09:00:00'),
    (UUID(), 61, 'MEDIUM', 'Establishing', 2, 3, 5, 3, 47, 29, 62, 2, 'Jan 2026 snapshot',          '2026-01-01 09:00:00'),
    (UUID(), 68, 'MEDIUM', 'Establishing', 2, 3, 4, 2, 47, 32, 68, 1, 'Feb 2026 — pre-integration', '2026-02-01 09:00:00');


-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT
    DATE_FORMAT(calculated_at, '%b %Y') AS period,
    score,
    risk_level,
    maturity_label,
    critical_gaps,
    high_gaps
FROM risk_snapshots
ORDER BY calculated_at ASC;

-- ============================================================================
-- DONE
-- ============================================================================
-- Next steps:
-- 1. Run this after gaps-schema-mysql.sql
-- 2. Verify 7 seed rows appear in the SELECT above
-- 3. Move to RiskSnapshot.java entity
-- ============================================================================
