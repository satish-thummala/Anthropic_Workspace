-- ============================================================================
-- REPORTS - DATABASE SCHEMA (MySQL 8.0+)
-- ============================================================================

-- ============================================================================
-- DROP EXISTING TABLE (if rebuilding)
-- ============================================================================
DROP TABLE IF EXISTS reports;

-- ============================================================================
-- TABLE: reports
-- ============================================================================
CREATE TABLE reports (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Report metadata
    name VARCHAR(500) NOT NULL,
    type ENUM('gap', 'coverage', 'risk', 'audit', 'policy', 'executive') NOT NULL,
    format ENUM('PDF', 'Excel', 'Word') NOT NULL DEFAULT 'PDF',
    
    -- File storage
    file_path VARCHAR(1000),
    file_size_bytes BIGINT,
    file_size_label VARCHAR(20),
    
    -- Status tracking
    status ENUM('generating', 'ready', 'failed') NOT NULL DEFAULT 'generating',
    error_message TEXT,
    
    -- Generation details
    generated_by_id BIGINT,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Report content summary (JSON)
    content_summary JSON,
    
    -- Parameters used for generation
    parameters JSON,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (generated_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_reports_type (type),
    INDEX idx_reports_status (status),
    INDEX idx_reports_generated_by (generated_by_id),
    INDEX idx_reports_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA - Initial Reports
-- ============================================================================

INSERT INTO reports (
    id, name, type, format, file_path, 
    file_size_bytes, file_size_label, status, 
    generated_at, content_summary
) VALUES 
(
    UUID(),
    'Q4 2025 ISO 27001 Gap Report',
    'gap',
    'PDF',
    '/reports/gap_iso27001_q4_2025.pdf',
    1258291,
    '1.2 MB',
    'ready',
    '2026-01-15 10:30:00',
    JSON_OBJECT(
        'totalGaps', 12,
        'criticalGaps', 3,
        'frameworks', JSON_ARRAY('ISO27001'),
        'coverage', 73
    )
),
(
    UUID(),
    'GDPR Compliance Summary',
    'coverage',
    'PDF',
    '/reports/coverage_gdpr_jan_2026.pdf',
    838860,
    '0.8 MB',
    'ready',
    '2026-01-28 14:15:00',
    JSON_OBJECT(
        'frameworks', JSON_ARRAY('GDPR'),
        'coverage', 88,
        'controlsCovered', 37,
        'totalControls', 42
    )
),
(
    UUID(),
    'SOC 2 Readiness Assessment',
    'risk',
    'Excel',
    '/reports/risk_soc2_feb_2026.xlsx',
    2202009,
    '2.1 MB',
    'ready',
    '2026-02-05 09:00:00',
    JSON_OBJECT(
        'riskScore', 68,
        'riskLevel', 'MEDIUM',
        'frameworks', JSON_ARRAY('SOC2'),
        'recommendations', 8
    )
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 
    id,
    name,
    type,
    format,
    file_size_label,
    status,
    generated_at
FROM reports
ORDER BY generated_at DESC;

-- ============================================================================
-- STATISTICS
-- ============================================================================

-- Count by type
SELECT 
    type,
    COUNT(*) as count,
    SUM(file_size_bytes) as total_bytes
FROM reports
WHERE status = 'ready'
GROUP BY type;

-- Count by status
SELECT 
    status,
    COUNT(*) as count
FROM reports
GROUP BY status;

-- Recent reports
SELECT 
    name,
    type,
    format,
    file_size_label,
    generated_at
FROM reports
WHERE status = 'ready'
ORDER BY generated_at DESC
LIMIT 10;

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Get reports by type
SELECT * FROM reports 
WHERE type = 'gap' 
ORDER BY generated_at DESC;

-- Get reports by user
SELECT 
    r.name,
    r.type,
    r.status,
    u.name as generated_by
FROM reports r
LEFT JOIN users u ON r.generated_by_id = u.id
WHERE r.generated_by_id = 1;

-- Get failed reports
SELECT * FROM reports 
WHERE status = 'failed' 
ORDER BY generated_at DESC;

-- Delete old reports (older than 90 days)
DELETE FROM reports 
WHERE generated_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND status = 'ready';

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Remove generating reports older than 1 hour (likely stuck)
UPDATE reports 
SET status = 'failed',
    error_message = 'Report generation timed out'
WHERE status = 'generating' 
  AND generated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 
    'Reports table created successfully!' as status,
    COUNT(*) as sample_reports_inserted
FROM reports;
