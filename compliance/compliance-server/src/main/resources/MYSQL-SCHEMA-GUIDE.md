# FRAMEWORKS DATABASE SCHEMA - MySQL Version

## 🎯 Key Differences from PostgreSQL

### MySQL-Specific Features:
✅ **CHAR(36)** instead of UUID type  
✅ **UUID()** function for generating IDs  
✅ **JSON** instead of TEXT[] for arrays  
✅ **ENUM** for severity levels  
✅ **ON UPDATE CURRENT_TIMESTAMP** for auto-updates  
✅ **InnoDB** engine with proper indexes  
✅ **utf8mb4** character set for full Unicode support  

---

## 🚀 Quick Start

### Run the Schema:
```bash
# Option 1: Command line
mysql -u root -p compliance_db < frameworks-schema-mysql.sql

# Option 2: MySQL Workbench
# File → Run SQL Script → Select frameworks-schema-mysql.sql

# Option 3: From MySQL prompt
mysql> source frameworks-schema-mysql.sql;
```

### Verify Installation:
```sql
-- Should show 4 frameworks
SELECT code, name, total_controls, covered_controls 
FROM frameworks;

-- Should show ~40 controls
SELECT COUNT(*) FROM controls;

-- Check coverage
SELECT code, 
       ROUND((covered_controls / total_controls) * 100, 2) as pct 
FROM frameworks;
```

---

## 📊 Sample Data Overview

### Frameworks:
```
ISO27001  | 15 controls | 11 covered | 73% | #3B82F6
SOC2      |  8 controls |  5 covered | 63% | #8B5CF6
GDPR      |  8 controls |  7 covered | 88% | #10B981
HIPAA     |  8 controls |  4 covered | 50% | #F59E0B
```

### Evidence Required (JSON Format):
```sql
-- MySQL stores as JSON
SELECT code, title, 
       JSON_EXTRACT(evidence_required, '$[0]') as first_evidence
FROM controls
WHERE code = 'A.5.1';

-- Returns: "Information Security Policy Document"
```

---

## 🔍 MySQL-Specific Queries

### Working with JSON Arrays:
```sql
-- Get all evidence for a control
SELECT code, title, evidence_required
FROM controls
WHERE code = 'A.8.5';

-- Check if specific evidence exists
SELECT code, title
FROM controls
WHERE JSON_CONTAINS(
    evidence_required, 
    '"MFA Configuration"'
);

-- Count evidence items
SELECT code, title,
       JSON_LENGTH(evidence_required) as evidence_count
FROM controls;
```

### Using ENUM for Severity:
```sql
-- Filter by severity (uses index)
SELECT code, title, severity
FROM controls
WHERE severity = 'CRITICAL';

-- Order by severity
SELECT code, title, severity
FROM controls
ORDER BY FIELD(severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
```

---

## 📋 Table Structures

### frameworks table:
```sql
id                CHAR(36) PRIMARY KEY
code              VARCHAR(50) UNIQUE
name              VARCHAR(255)
version           VARCHAR(50)
description       TEXT
color             VARCHAR(20)
total_controls    INT
covered_controls  INT
industry          VARCHAR(100)
published_date    DATE
is_active         BOOLEAN
created_at        TIMESTAMP
updated_at        TIMESTAMP (auto-updates)
```

### controls table:
```sql
id                      CHAR(36) PRIMARY KEY
framework_id            CHAR(36) (FK)
code                    VARCHAR(100)
title                   VARCHAR(500)
description             TEXT
category                VARCHAR(200)
severity                ENUM('CRITICAL','HIGH','MEDIUM','LOW')
implementation_guidance TEXT
is_covered              BOOLEAN
evidence_required       JSON
display_order           INT
created_at              TIMESTAMP
updated_at              TIMESTAMP (auto-updates)
```

---

## 🔧 Common Operations

### Get Framework with Controls:
```sql
SELECT 
    f.code,
    f.name,
    f.total_controls,
    f.covered_controls,
    c.code as control_code,
    c.title as control_title,
    c.is_covered
FROM frameworks f
LEFT JOIN controls c ON c.framework_id = f.id
WHERE f.code = 'ISO27001'
ORDER BY c.display_order;
```

### Toggle Control Coverage:
```sql
-- Mark control as covered
UPDATE controls
SET is_covered = TRUE
WHERE code = 'A.5.3' 
  AND framework_id = (
      SELECT id FROM frameworks WHERE code = 'ISO27001'
  );

-- Recalculate framework stats
UPDATE frameworks f
SET covered_controls = (
    SELECT COUNT(*) 
    FROM controls c 
    WHERE c.framework_id = f.id AND c.is_covered = TRUE
)
WHERE code = 'ISO27001';
```

### Get Gaps (Uncovered Controls):
```sql
SELECT 
    f.code as framework,
    c.code,
    c.title,
    c.severity,
    c.category
FROM controls c
JOIN frameworks f ON c.framework_id = f.id
WHERE c.is_covered = FALSE
ORDER BY 
    FIELD(c.severity, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'),
    f.code;
```

---

## 🎯 MySQL Performance Tips

### Check Indexes:
```sql
SHOW INDEX FROM frameworks;
SHOW INDEX FROM controls;
```

### Optimize Queries:
```sql
-- Use EXPLAIN to check query performance
EXPLAIN SELECT * FROM controls 
WHERE framework_id = 'some-uuid' AND is_covered = TRUE;
```

### Update Statistics:
```sql
ANALYZE TABLE frameworks;
ANALYZE TABLE controls;
```

---

## ⚠️ Important MySQL Notes

### UUID Generation:
```sql
-- MySQL 8.0+ has UUID() function
INSERT INTO frameworks (id, code, name, ...) 
VALUES (UUID(), 'CUSTOM', 'My Framework', ...);
```

### JSON Operations:
```sql
-- Add item to JSON array
UPDATE controls
SET evidence_required = JSON_ARRAY_APPEND(
    evidence_required, 
    '$', 
    'New Evidence Item'
)
WHERE code = 'A.5.1';

-- Remove item from JSON array
UPDATE controls
SET evidence_required = JSON_REMOVE(
    evidence_required, 
    '$[0]'
)
WHERE code = 'A.5.1';
```

### Character Set:
```sql
-- Verify utf8mb4 (supports emojis, special chars)
SHOW CREATE TABLE frameworks;

-- Should show: CHARSET=utf8mb4
```

---

## 🔄 Migration from PostgreSQL

If you have PostgreSQL data:

```sql
-- PostgreSQL UUID becomes:
id UUID → id CHAR(36)

-- PostgreSQL TEXT[] becomes:
evidence TEXT[] → evidence_required JSON

-- PostgreSQL CHECK becomes:
CHECK (severity IN (...)) → ENUM('CRITICAL','HIGH','MEDIUM','LOW')
```

---

## ✅ Verification Checklist

Run these to verify everything works:

```sql
-- ✓ Tables created
SHOW TABLES;

-- ✓ Data inserted
SELECT COUNT(*) FROM frameworks; -- Should be 4
SELECT COUNT(*) FROM controls;   -- Should be ~40

-- ✓ Foreign keys working
SELECT c.code, f.code 
FROM controls c 
JOIN frameworks f ON c.framework_id = f.id 
LIMIT 5;

-- ✓ JSON working
SELECT code, JSON_LENGTH(evidence_required) as evidence_count
FROM controls 
LIMIT 5;

-- ✓ Indexes created
SHOW INDEX FROM controls;
```

---

## 🎉 Ready to Go!

Your MySQL database is now set up with:
- ✅ 4 compliance frameworks
- ✅ ~40 realistic controls
- ✅ Proper indexes and foreign keys
- ✅ JSON support for arrays
- ✅ Auto-updating timestamps

**Next:** Create Java backend entities!
