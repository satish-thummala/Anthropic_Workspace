-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    type         VARCHAR(30)  NOT NULL,
    title        VARCHAR(200) NOT NULL,
    message      TEXT         NOT NULL,
    link_page    VARCHAR(50)  DEFAULT NULL,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   DATETIME     NOT NULL,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read  (user_id, is_read),
    INDEX idx_notif_created_at (created_at)
);

-- Sarah Chen (id=1)
INSERT INTO notifications (id, user_id, type, title, message, link_page, is_read, created_at) VALUES
  (UUID(), 1, 'CRITICAL_GAP', '3 Critical Gaps Require Immediate Action',  '3 critical compliance gaps in ISO 27001 and SOC2 are unresolved and past their target date. Immediate remediation required.',       'gaps',       FALSE, NOW()),
  (UUID(), 1, 'RISK_CHANGE',  'Risk Score Dropped to High',                 'Your compliance risk score fell from 68 to 54 this week due to 5 newly identified gaps in GDPR framework.',                          'risk',       FALSE, NOW()),
  (UUID(), 1, 'HIGH_GAP',     '7 High-Severity Gaps Assigned to You',       '7 high-severity gaps across 3 frameworks are currently assigned to your team with remediation deadlines in the next 14 days.',        'gaps',       FALSE, NOW()),
  (UUID(), 1, 'FRAMEWORK',    'ISO 27001 Coverage Below 60%',               'ISO 27001 framework coverage has dropped to 58%. 12 controls need evidence or remediation to meet the 70% threshold.',               'frameworks', FALSE, NOW()),
  (UUID(), 1, 'SYSTEM',       'Monthly Compliance Report Ready',            'The October 2025 executive compliance summary report has been generated and is ready for download.',                                   'reports',    TRUE,  NOW()),
  (UUID(), 1, 'SYSTEM',       'AI Insights Engine Connected',               'Groq AI engine is active. Gap prioritisation, explainer and executive brief features are now running on llama-3.3-70b-versatile.',    'aiInsights', TRUE,  NOW());

-- James Patel (id=2)
INSERT INTO notifications (id, user_id, type, title, message, link_page, is_read, created_at) VALUES
  (UUID(), 2, 'CRITICAL_GAP', '3 Critical Gaps Require Immediate Action',  '3 critical compliance gaps in ISO 27001 and SOC2 are unresolved and past their target date. Immediate remediation required.',       'gaps',       FALSE, NOW()),
  (UUID(), 2, 'RISK_CHANGE',  'Risk Score Dropped to High',                 'Your compliance risk score fell from 68 to 54 this week due to 5 newly identified gaps in GDPR framework.',                          'risk',       FALSE, NOW()),
  (UUID(), 2, 'FRAMEWORK',    'SOC2 Audit Deadline in 30 Days',             'SOC2 Type II audit is scheduled in 30 days. Current coverage is 71% — 8 controls still require evidence before the audit window.',   'frameworks', FALSE, NOW()),
  (UUID(), 2, 'SYSTEM',       'Monthly Compliance Report Ready',            'The October 2025 executive compliance summary report has been generated and is ready for download.',                                   'reports',    TRUE,  NOW());

-- Emily Rodriguez (id=3)
INSERT INTO notifications (id, user_id, type, title, message, link_page, is_read, created_at) VALUES
  (UUID(), 3, 'HIGH_GAP',     '7 High-Severity Gaps Assigned to You',       '7 high-severity gaps across 3 frameworks are currently assigned to your team with remediation deadlines in the next 14 days.',        'gaps',       FALSE, NOW()),
  (UUID(), 3, 'FRAMEWORK',    'GDPR Coverage Needs Attention',              'GDPR framework has 14 open gaps. 4 of them are high severity and approaching target dates.',                                          'frameworks', FALSE, NOW()),
  (UUID(), 3, 'SYSTEM',       'New Document Analyzed Successfully',         'The uploaded "Security Policy v3.pdf" has been analyzed and mapped to 6 ISO 27001 controls.',                                         'documents',  TRUE,  NOW());
