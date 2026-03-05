# GAP ANALYSIS - DATABASE SCHEMA GUIDE

## 🎯 Two Approaches Available

### **Approach 1: Dedicated Gaps Table (RECOMMENDED)**
- ✅ Full gap lifecycle tracking
- ✅ Assign gaps to users
- ✅ Track status changes
- ✅ Add custom notes
- ✅ Historical timeline

### **Approach 2: Virtual Gaps (Simple)**
- ✅ No new table needed
- ✅ Always synced with controls
- ✅ Lighter database
- ✅ Query-only approach

**I recommend Approach 1** for full features!

---

## 🚀 Quick Setup

### **Step 1: Run the Schema**

**In phpMyAdmin:**
1. Open `compliance_db` database
2. Click `SQL` tab
3. Copy ENTIRE `gaps-schema-mysql.sql` file
4. Paste and click `Go`

**Or from command line:**
```bash
mysql -u root -p compliance_db < gaps-schema-mysql.sql
```

### **Step 2: Verify Gaps Created**

```sql
-- Should show gaps from uncovered controls
SELECT COUNT(*) FROM gaps;

-- Check gaps by severity
SELECT severity, COUNT(*) as count
FROM gaps
GROUP BY severity;
```

---

## 📊 What You Get

### **Gaps Table Structure:**
- id, control_id, framework_id
- gap_type, severity, status
- description, ai_suggestion, remediation_notes
- assigned_to, priority
- identified_at, resolved_at, target_date
- evidence_required (JSON)

### **Auto-Created:**
- ✅ Gap records for all uncovered controls
- ✅ Triggers for auto-sync with controls
- ✅ Sample assigned/in-progress/resolved gaps
- ✅ All indexes and foreign keys

### **Gap Counts Expected:**
```
ISO27001: ~4 gaps (controls with is_covered=false)
SOC2:     ~3 gaps
GDPR:     ~1 gap
HIPAA:    ~4 gaps
Total:    ~12 gaps
```

---

## 🔍 Key Queries

### Get All Open Gaps:
```sql
SELECT 
    g.id,
    f.code as framework,
    c.code as control,
    c.title,
    g.severity,
    g.status
FROM gaps g
JOIN controls c ON g.control_id = c.id
JOIN frameworks f ON g.framework_id = f.id
WHERE g.status = 'open';
```

### Get Critical Gaps:
```sql
SELECT * FROM gaps 
WHERE severity = 'CRITICAL' AND status != 'resolved';
```

### Get My Assigned Gaps:
```sql
SELECT * FROM gaps
WHERE assigned_to = (SELECT id FROM users WHERE email = 'your@email.com');
```

---

## ✅ Verification

Run this after setup:
```sql
SELECT 
    COUNT(*) as total_gaps,
    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_gaps,
    SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_gaps
FROM gaps;
```

**Expected:** 10-15 gaps total, mix of severities

---

## 🎯 Next Steps

After schema is ready:
1. ✅ Verify gaps table exists
2. ✅ Check gaps were auto-created
3. ➡️ Create Java entities (Gap.java)
4. ➡️ Create GapController
5. ➡️ Integrate with React frontend

**Ready to move to Java backend!** 🚀
