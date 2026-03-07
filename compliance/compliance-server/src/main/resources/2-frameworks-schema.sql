-- ============================================================================
-- COMPLIANCE FRAMEWORKS - DATABASE SCHEMA (MySQL 8.0+)
-- ============================================================================
-- Run this script to create tables and populate with sample data
-- MySQL 8.0 or higher required

-- ============================================================================
-- DROP EXISTING TABLES (if rebuilding)
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS control_documents;
DROP TABLE IF EXISTS controls;
DROP TABLE IF EXISTS frameworks;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLE: frameworks
-- ============================================================================
CREATE TABLE frameworks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(20) NOT NULL,
    total_controls INT NOT NULL DEFAULT 0,
    covered_controls INT NOT NULL DEFAULT 0,
    industry VARCHAR(100),
    published_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: controls
-- ============================================================================
CREATE TABLE controls (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    framework_id CHAR(36) NOT NULL,
    code VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(200),
    severity ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL,
    implementation_guidance TEXT,
    is_covered BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_required JSON,
    display_order INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_framework_code (framework_id, code),
    INDEX idx_framework (framework_id),
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_severity (severity),
    INDEX idx_covered (is_covered),
    INDEX idx_framework_covered (framework_id, is_covered),
    INDEX idx_framework_severity (framework_id, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: control_documents (junction table for many-to-many)
-- ============================================================================
CREATE TABLE control_documents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    control_id CHAR(36) NOT NULL,
    document_id CHAR(36),
    coverage_percentage DECIMAL(5,2) DEFAULT 0.00,
    matched_keywords JSON,
    confidence_score DECIMAL(5,2),
    mapped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mapped_by CHAR(36),
    FOREIGN KEY (control_id) REFERENCES controls(id) ON DELETE CASCADE,
    UNIQUE KEY unique_control_document (control_id, document_id),
    INDEX idx_control (control_id),
    INDEX idx_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA: FRAMEWORKS
-- ============================================================================

-- ISO/IEC 27001:2022
INSERT INTO frameworks (id, code, name, version, description, color, total_controls, covered_controls, industry, published_date) VALUES
(UUID(), 'ISO27001', 'ISO/IEC 27001', '2022', 'Information Security Management System standard providing requirements for establishing, implementing, maintaining and continually improving an ISMS', '#3B82F6', 93, 71, 'Technology', '2022-10-25');

-- SOC 2 Type II
INSERT INTO frameworks (id, code, name, version, description, color, total_controls, covered_controls, industry, published_date) VALUES
(UUID(), 'SOC2', 'SOC 2 Type II', '2017', 'Service Organization Control framework for managing customer data based on five trust service principles', '#8B5CF6', 64, 48, 'Technology', '2017-05-01');

-- GDPR
INSERT INTO frameworks (id, code, name, version, description, color, total_controls, covered_controls, industry, published_date) VALUES
(UUID(), 'GDPR', 'General Data Protection Regulation', '2018', 'EU regulation on data protection and privacy for all individuals within the European Union and EEA', '#10B981', 42, 38, 'All Industries', '2018-05-25');

-- HIPAA
INSERT INTO frameworks (id, code, name, version, description, color, total_controls, covered_controls, industry, published_date) VALUES
(UUID(), 'HIPAA', 'HIPAA Security Rule', '2013', 'Health Insurance Portability and Accountability Act - safeguards for protecting electronic protected health information', '#F59E0B', 54, 29, 'Healthcare', '2013-09-23');

-- ============================================================================
-- SAMPLE DATA: CONTROLS - ISO 27001 (Annex A Controls)
-- ============================================================================

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.5.1',
    'Policies for Information Security',
    'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals or if significant changes occur.',
    'Organizational Controls',
    'HIGH',
    'Develop and document an information security policy approved by senior management. Ensure the policy is communicated to all employees and reviewed annually.',
    TRUE,
    JSON_ARRAY('Information Security Policy Document', 'Board Approval Minutes', 'Communication Records', 'Acknowledgment Forms'),
    1
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.5.2',
    'Information Security Roles and Responsibilities',
    'Information security roles and responsibilities shall be defined and allocated according to the organization needs.',
    'Organizational Controls',
    'HIGH',
    'Create role definitions with specific security responsibilities. Document in job descriptions and organizational charts.',
    TRUE,
    JSON_ARRAY('Job Descriptions', 'RACI Matrix', 'Organizational Chart'),
    2
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.5.3',
    'Segregation of Duties',
    'Conflicting duties and conflicting areas of responsibility shall be segregated.',
    'Organizational Controls',
    'CRITICAL',
    'Identify and document conflicting duties. Implement controls to prevent single individuals from having excessive access or authority.',
    FALSE,
    JSON_ARRAY('Segregation of Duties Policy', 'Access Control Matrix', 'Approval Workflows'),
    3
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.6.1',
    'Screening',
    'Background verification checks on all candidates for employment shall be carried out prior to joining the organization and on an ongoing basis.',
    'People Controls',
    'HIGH',
    'Implement background check procedures for new hires. Define levels of checks based on role sensitivity.',
    TRUE,
    JSON_ARRAY('Background Check Policy', 'Vendor Contracts', 'Check Results (anonymized)'),
    4
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.6.2',
    'Terms and Conditions of Employment',
    'The employment contractual agreements shall state the employees and the organizations responsibilities for information security.',
    'People Controls',
    'MEDIUM',
    'Include information security clauses in employment contracts and NDAs.',
    TRUE,
    JSON_ARRAY('Employment Contract Template', 'NDA Template', 'Signed Agreements'),
    5
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.6.3',
    'Information Security Awareness, Education and Training',
    'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training.',
    'People Controls',
    'HIGH',
    'Develop security awareness program with regular training sessions. Track completion and effectiveness.',
    TRUE,
    JSON_ARRAY('Training Materials', 'Attendance Records', 'Quiz Results', 'Training Calendar'),
    6
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.6.4',
    'Disciplinary Process',
    'A disciplinary process shall be formalized and communicated to take action against personnel who have committed an information security breach.',
    'People Controls',
    'MEDIUM',
    'Document disciplinary procedures for security violations. Ensure procedures are fair and legally compliant.',
    FALSE,
    JSON_ARRAY('Disciplinary Policy', 'Incident Records', 'HR Process Documentation'),
    7
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.7.1',
    'Physical Security Perimeters',
    'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
    'Physical Controls',
    'HIGH',
    'Implement physical barriers, access control systems, and monitoring for sensitive areas.',
    TRUE,
    JSON_ARRAY('Floor Plans', 'Access Control Logs', 'Visitor Logs'),
    8
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.7.2',
    'Physical Entry',
    'Secure areas shall be protected by appropriate entry controls and access points.',
    'Physical Controls',
    'HIGH',
    'Deploy badge readers, biometric systems, or security personnel at entry points.',
    TRUE,
    JSON_ARRAY('Access Control System Config', 'Badge Issuance Records', 'Access Logs'),
    9
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.7.3',
    'Securing Offices, Rooms and Facilities',
    'Physical security for offices, rooms and facilities shall be designed and implemented.',
    'Physical Controls',
    'MEDIUM',
    'Secure server rooms, network closets, and storage areas with locks and monitoring.',
    FALSE,
    JSON_ARRAY('Security Assessment', 'Lock Inventory', 'CCTV Coverage Map'),
    10
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.8.1',
    'User Endpoint Devices',
    'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
    'Technological Controls',
    'CRITICAL',
    'Implement endpoint protection, encryption, remote wipe, and MDM solutions.',
    TRUE,
    JSON_ARRAY('Endpoint Protection Policy', 'MDM Configuration', 'Encryption Status Report'),
    11
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.8.2',
    'Privileged Access Rights',
    'The allocation and use of privileged access rights shall be restricted and managed.',
    'Technological Controls',
    'CRITICAL',
    'Implement privileged access management (PAM) solution. Require approval for privilege escalation.',
    TRUE,
    JSON_ARRAY('PAM Configuration', 'Privilege Access Requests', 'Audit Logs'),
    12
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.8.3',
    'Information Access Restriction',
    'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.',
    'Technological Controls',
    'HIGH',
    'Implement role-based access control (RBAC). Review access permissions quarterly.',
    TRUE,
    JSON_ARRAY('Access Control Policy', 'User Access Matrix', 'Access Review Reports'),
    13
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.8.4',
    'Access to Source Code',
    'Read and write access to source code, development tools and software libraries shall be appropriately managed.',
    'Technological Controls',
    'HIGH',
    'Restrict source code access using version control permissions. Implement code review process.',
    FALSE,
    JSON_ARRAY('Git Repository Permissions', 'Code Review Policy', 'Access Logs'),
    14
FROM frameworks WHERE code = 'ISO27001';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A.8.5',
    'Secure Authentication',
    'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.',
    'Technological Controls',
    'CRITICAL',
    'Implement MFA for all user accounts. Enforce strong password policies.',
    TRUE,
    JSON_ARRAY('MFA Configuration', 'Password Policy', 'Authentication Logs'),
    15
FROM frameworks WHERE code = 'ISO27001';

-- ============================================================================
-- SAMPLE DATA: CONTROLS - SOC 2 (Trust Service Criteria)
-- ============================================================================

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC1.1',
    'Control Environment - Integrity and Ethics',
    'The entity demonstrates a commitment to integrity and ethical values.',
    'Common Criteria',
    'HIGH',
    'Establish and communicate code of conduct. Implement ethics training program.',
    TRUE,
    JSON_ARRAY('Code of Conduct', 'Ethics Training Records', 'Whistleblower Policy'),
    1
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC1.2',
    'Board Independence and Oversight',
    'The board of directors demonstrates independence from management and exercises oversight.',
    'Common Criteria',
    'MEDIUM',
    'Ensure board has independent members. Document oversight activities and meetings.',
    TRUE,
    JSON_ARRAY('Board Charter', 'Meeting Minutes', 'Independence Attestations'),
    2
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC2.1',
    'Risk Assessment Process',
    'The entity defines risk and establishes risk tolerance.',
    'Common Criteria',
    'HIGH',
    'Develop risk assessment methodology. Conduct annual risk assessments.',
    FALSE,
    JSON_ARRAY('Risk Assessment Policy', 'Risk Register', 'Risk Treatment Plans'),
    3
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC3.1',
    'Policies and Procedures Established',
    'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks.',
    'Common Criteria',
    'MEDIUM',
    'Document all security policies and procedures. Ensure they are reviewed and approved.',
    TRUE,
    JSON_ARRAY('Policy Library', 'Approval Records', 'Version Control'),
    4
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC6.1',
    'Logical and Physical Access Controls',
    'The entity implements logical and physical access controls to meet the requirements of the entity security policies.',
    'Common Criteria',
    'CRITICAL',
    'Implement access control systems for both logical (systems) and physical (facilities) access.',
    TRUE,
    JSON_ARRAY('Access Control Matrix', 'Badge System Config', 'VPN Logs'),
    5
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC6.6',
    'Logical Access Security Measures',
    'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
    'Common Criteria',
    'CRITICAL',
    'Deploy firewalls, IDS/IPS, and regular security assessments.',
    FALSE,
    JSON_ARRAY('Firewall Rules', 'IDS/IPS Logs', 'Penetration Test Reports'),
    6
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'CC7.2',
    'System Monitoring',
    'The entity monitors system components and the operation of those components for anomalies.',
    'Common Criteria',
    'HIGH',
    'Implement SIEM or log aggregation. Set up alerts for anomalous activity.',
    TRUE,
    JSON_ARRAY('SIEM Configuration', 'Alert Rules', 'Incident Response Logs'),
    7
FROM frameworks WHERE code = 'SOC2';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'A1.1',
    'Availability - Continuity Planning',
    'The entity maintains system components including infrastructure, data, and software to support availability.',
    'Availability',
    'HIGH',
    'Develop and test business continuity and disaster recovery plans.',
    TRUE,
    JSON_ARRAY('BCP/DR Plans', 'Test Results', 'RTO/RPO Documentation'),
    8
FROM frameworks WHERE code = 'SOC2';

-- ============================================================================
-- SAMPLE DATA: CONTROLS - GDPR
-- ============================================================================

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 5',
    'Principles Relating to Processing',
    'Personal data shall be processed lawfully, fairly and in a transparent manner, collected for specified purposes, adequate and relevant, accurate, and kept for no longer than necessary.',
    'General Provisions',
    'CRITICAL',
    'Document lawful basis for all data processing. Implement data minimization and purpose limitation.',
    TRUE,
    JSON_ARRAY('Privacy Policy', 'Data Processing Records', 'Consent Forms'),
    1
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 6',
    'Lawfulness of Processing',
    'Processing shall be lawful only if at least one legal basis applies (consent, contract, legal obligation, vital interests, public task, or legitimate interests).',
    'General Provisions',
    'CRITICAL',
    'Identify and document lawful basis for each processing activity.',
    TRUE,
    JSON_ARRAY('Data Processing Inventory', 'Legal Basis Assessment', 'Consent Management'),
    2
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 15',
    'Right of Access',
    'The data subject shall have the right to obtain confirmation as to whether personal data is being processed and access to the data.',
    'Rights of Data Subject',
    'HIGH',
    'Implement data subject access request (DSAR) process with 30-day response timeframe.',
    TRUE,
    JSON_ARRAY('DSAR Procedure', 'Request Logs', 'Response Templates'),
    3
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 17',
    'Right to Erasure (Right to be Forgotten)',
    'The data subject shall have the right to obtain erasure of personal data without undue delay under certain circumstances.',
    'Rights of Data Subject',
    'HIGH',
    'Implement data deletion process. Verify deletions across all systems.',
    TRUE,
    JSON_ARRAY('Deletion Procedure', 'Deletion Logs', 'Verification Reports'),
    4
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 25',
    'Data Protection by Design and Default',
    'The controller shall implement appropriate technical and organizational measures to ensure that only necessary personal data is processed.',
    'Controller and Processor',
    'HIGH',
    'Integrate privacy considerations into system design. Apply privacy by default settings.',
    FALSE,
    JSON_ARRAY('Privacy Impact Assessments', 'System Design Docs', 'Default Settings'),
    5
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 32',
    'Security of Processing',
    'The controller and processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.',
    'Controller and Processor',
    'CRITICAL',
    'Implement encryption, pseudonymization, regular security testing, and incident response.',
    TRUE,
    JSON_ARRAY('Security Controls Documentation', 'Encryption Policies', 'Pen Test Reports'),
    6
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 33',
    'Notification of Data Breach to Authority',
    'In case of a personal data breach, the controller shall notify the supervisory authority within 72 hours.',
    'Controller and Processor',
    'CRITICAL',
    'Establish breach notification procedure. Maintain incident response team.',
    TRUE,
    JSON_ARRAY('Breach Response Plan', 'Incident Logs', 'Notification Templates'),
    7
FROM frameworks WHERE code = 'GDPR';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    'Art. 35',
    'Data Protection Impact Assessment',
    'Where processing is likely to result in high risk, the controller shall carry out an assessment of the impact.',
    'Controller and Processor',
    'HIGH',
    'Conduct DPIAs for high-risk processing activities. Document findings and mitigations.',
    TRUE,
    JSON_ARRAY('DPIA Template', 'Completed DPIAs', 'Risk Mitigation Plans'),
    8
FROM frameworks WHERE code = 'GDPR';

-- ============================================================================
-- SAMPLE DATA: CONTROLS - HIPAA
-- ============================================================================

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.308(a)(1)',
    'Security Management Process',
    'Implement policies and procedures to prevent, detect, contain, and correct security violations.',
    'Administrative Safeguards',
    'CRITICAL',
    'Develop comprehensive security program with risk analysis, risk management, and sanction policies.',
    FALSE,
    JSON_ARRAY('Security Program Documentation', 'Risk Analysis', 'Sanction Policy'),
    1
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.308(a)(3)',
    'Workforce Security',
    'Implement policies and procedures to ensure workforce members have appropriate access to ePHI.',
    'Administrative Safeguards',
    'HIGH',
    'Establish workforce access authorization and termination procedures.',
    TRUE,
    JSON_ARRAY('Access Control Policy', 'Termination Checklist', 'Access Review Reports'),
    2
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.308(a)(4)',
    'Information Access Management',
    'Implement policies and procedures for authorizing access to ePHI.',
    'Administrative Safeguards',
    'HIGH',
    'Create access authorization policies. Implement access establishment and modification procedures.',
    FALSE,
    JSON_ARRAY('Access Authorization Policy', 'Access Request Forms', 'Approval Logs'),
    3
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.308(a)(5)',
    'Security Awareness and Training',
    'Implement security awareness and training program for all workforce members.',
    'Administrative Safeguards',
    'HIGH',
    'Conduct annual HIPAA security training. Include password management, malware protection, and incident response.',
    TRUE,
    JSON_ARRAY('Training Materials', 'Attendance Records', 'Quiz Results'),
    4
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.310(a)(1)',
    'Facility Access Controls',
    'Implement policies and procedures to limit physical access to electronic information systems and facilities.',
    'Physical Safeguards',
    'HIGH',
    'Establish facility security plan with access controls and visitor procedures.',
    TRUE,
    JSON_ARRAY('Facility Security Plan', 'Access Logs', 'Visitor Logs'),
    5
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.312(a)(1)',
    'Access Control',
    'Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons.',
    'Technical Safeguards',
    'CRITICAL',
    'Deploy unique user IDs, emergency access procedures, automatic logoff, and encryption.',
    FALSE,
    JSON_ARRAY('Access Control Configuration', 'User ID List', 'Encryption Status'),
    6
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.312(b)',
    'Audit Controls',
    'Implement hardware, software, and procedural mechanisms that record and examine activity in information systems.',
    'Technical Safeguards',
    'HIGH',
    'Enable audit logging on all systems containing ePHI. Review logs regularly.',
    TRUE,
    JSON_ARRAY('Audit Log Configuration', 'Log Review Reports', 'SIEM Setup'),
    7
FROM frameworks WHERE code = 'HIPAA';

INSERT INTO controls (id, framework_id, code, title, description, category, severity, implementation_guidance, is_covered, evidence_required, display_order)
SELECT 
    UUID(),
    id,
    '164.312(e)(1)',
    'Transmission Security',
    'Implement technical security measures to guard against unauthorized access to ePHI transmitted over electronic networks.',
    'Technical Safeguards',
    'CRITICAL',
    'Use encryption (TLS 1.2+) for all ePHI transmissions. Implement integrity controls.',
    TRUE,
    JSON_ARRAY('Encryption Policy', 'TLS Configuration', 'Network Diagrams'),
    8
FROM frameworks WHERE code = 'HIPAA';

-- ============================================================================
-- UPDATE FRAMEWORK STATISTICS
-- ============================================================================

UPDATE frameworks f
SET covered_controls = (
    SELECT COUNT(*) 
    FROM controls c 
    WHERE c.framework_id = f.id AND c.is_covered = TRUE
);

UPDATE frameworks f
SET total_controls = (
    SELECT COUNT(*) 
    FROM controls c 
    WHERE c.framework_id = f.id
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show framework summary
SELECT 
    code,
    name,
    version,
    total_controls,
    covered_controls,
    ROUND((covered_controls / NULLIF(total_controls, 0)) * 100, 2) as coverage_pct,
    color
FROM frameworks
ORDER BY code;

-- Show control counts by framework and category
SELECT 
    f.code as framework,
    c.category,
    COUNT(*) as control_count,
    SUM(CASE WHEN c.is_covered THEN 1 ELSE 0 END) as covered_count
FROM frameworks f
JOIN controls c ON c.framework_id = f.id
GROUP BY f.code, c.category
ORDER BY f.code, c.category;

-- Show controls by severity
SELECT 
    f.code as framework,
    c.severity,
    COUNT(*) as total,
    SUM(CASE WHEN c.is_covered THEN 1 ELSE 0 END) as covered
FROM frameworks f
JOIN controls c ON c.framework_id = f.id
GROUP BY f.code, c.severity
ORDER BY f.code, 
    CASE c.severity 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
    END;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✓ Frameworks schema created successfully!' as status
UNION ALL
SELECT '✓ 4 frameworks inserted: ISO27001, SOC2, GDPR, HIPAA' 
UNION ALL
SELECT '✓ Sample controls inserted for each framework'
UNION ALL
SELECT '✓ Run verification queries above to see results';
