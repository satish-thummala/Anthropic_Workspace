package com.techcorp.compliance.service.gapdetection;

import java.util.*;

/**
 * ControlKeywordsDictionary
 * 
 * Maps compliance framework controls to their identifying keywords.
 * Used by GapDetectionService to automatically detect which controls
 * are covered in uploaded documents.
 * 
 * How it works:
 *   - Each control has a list of keywords
 *   - If a document contains ANY of these keywords, the control is "covered"
 *   - Confidence score = (matched keywords / total keywords) * 100
 */
public class ControlKeywordsDictionary {

    // ══════════════════════════════════════════════════════════════════════════
    // ISO 27001:2013 CONTROL KEYWORDS
    // ══════════════════════════════════════════════════════════════════════════

    private static final Map<String, List<String>> ISO27001_KEYWORDS = Map.ofEntries(
        
        // A.5 - Information Security Policies
        Map.entry("A.5.1", Arrays.asList(
            "information security policy", "security policy", "policy framework",
            "policy approval", "policy review", "security objectives"
        )),

        // A.6 - Organization of Information Security
        Map.entry("A.6.1", Arrays.asList(
            "security roles", "security responsibilities", "CISO", "security officer",
            "information security manager", "security governance"
        )),
        Map.entry("A.6.2", Arrays.asList(
            "mobile device", "BYOD", "bring your own device", "remote working",
            "telework", "mobile security", "device policy"
        )),

        // A.7 - Human Resource Security
        Map.entry("A.7.1", Arrays.asList(
            "background check", "background verification", "screening",
            "employment verification", "reference check"
        )),
        Map.entry("A.7.2", Arrays.asList(
            "security awareness", "security training", "security education",
            "training program", "awareness campaign"
        )),
        Map.entry("A.7.3", Arrays.asList(
            "termination", "resignation", "access revocation", "exit process",
            "account deactivation", "offboarding"
        )),

        // A.8 - Asset Management
        Map.entry("A.8.1", Arrays.asList(
            "asset inventory", "asset register", "asset owner", "asset classification",
            "information asset", "asset management"
        )),
        Map.entry("A.8.2", Arrays.asList(
            "information classification", "data classification", "confidentiality level",
            "public", "internal", "confidential", "restricted", "classification scheme"
        )),
        Map.entry("A.8.3", Arrays.asList(
            "media handling", "media disposal", "secure disposal", "data destruction",
            "shredding", "degaussing", "certificate of destruction"
        )),

        // A.9 - Access Control
        Map.entry("A.9.1", Arrays.asList(
            "access control policy", "access control", "authorization", "authentication",
            "access management", "least privilege", "need to know"
        )),
        Map.entry("A.9.2", Arrays.asList(
            "user registration", "user access", "account provisioning", "user id",
            "access request", "access approval"
        )),
        Map.entry("A.9.3", Arrays.asList(
            "password", "password policy", "password complexity", "password expiration",
            "password strength", "credential management"
        )),
        Map.entry("A.9.4", Arrays.asList(
            "access review", "user access review", "access recertification",
            "privileged access", "admin access", "elevated privileges"
        )),

        // A.10 - Cryptography
        Map.entry("A.10.1", Arrays.asList(
            "encryption", "cryptography", "cryptographic", "cipher", "AES", "RSA",
            "encrypt", "encrypted", "encryption key", "data encryption",
            "encryption at rest", "encryption in transit", "TLS", "SSL"
        )),

        // A.11 - Physical and Environmental Security
        Map.entry("A.11.1", Arrays.asList(
            "physical security", "secure area", "physical access", "badge access",
            "perimeter security", "access control system", "visitor management"
        )),
        Map.entry("A.11.2", Arrays.asList(
            "equipment security", "equipment protection", "asset protection",
            "cable lock", "equipment disposal", "maintenance"
        )),

        // A.12 - Operations Security
        Map.entry("A.12.1", Arrays.asList(
            "operational procedures", "documented procedures", "standard operating procedure",
            "SOP", "change control", "change management"
        )),
        Map.entry("A.12.2", Arrays.asList(
            "malware", "antivirus", "anti-malware", "malware protection",
            "endpoint protection", "virus", "ransomware"
        )),
        Map.entry("A.12.3", Arrays.asList(
            "backup", "backup and recovery", "disaster recovery", "business continuity",
            "data backup", "restore", "recovery", "backup testing"
        )),
        Map.entry("A.12.4", Arrays.asList(
            "logging", "audit log", "event log", "log management", "log monitoring",
            "SIEM", "log retention", "audit trail"
        )),
        Map.entry("A.12.5", Arrays.asList(
            "software installation", "software control", "approved software",
            "software management", "installation control"
        )),
        Map.entry("A.12.6", Arrays.asList(
            "vulnerability", "vulnerability management", "vulnerability scanning",
            "patch management", "patching", "security patch", "vulnerability assessment"
        )),

        // A.13 - Communications Security
        Map.entry("A.13.1", Arrays.asList(
            "network security", "network control", "network segregation", "firewall",
            "network segmentation", "DMZ", "VLAN"
        )),
        Map.entry("A.13.2", Arrays.asList(
            "information transfer", "data transfer", "file transfer", "SFTP",
            "secure transfer", "encryption in transit"
        )),

        // A.14 - System Acquisition, Development and Maintenance
        Map.entry("A.14.1", Arrays.asList(
            "security requirements", "system requirements", "secure development",
            "SDLC", "security by design", "security architecture"
        )),
        Map.entry("A.14.2", Arrays.asList(
            "secure coding", "code review", "security testing", "penetration testing",
            "SAST", "DAST", "application security", "OWASP"
        )),
        Map.entry("A.14.3", Arrays.asList(
            "test data", "production data", "data masking", "test environment",
            "synthetic data"
        )),

        // A.15 - Supplier Relationships
        Map.entry("A.15.1", Arrays.asList(
            "supplier security", "vendor security", "third party", "supplier agreement",
            "vendor management", "third-party risk", "supplier assessment"
        )),
        Map.entry("A.15.2", Arrays.asList(
            "service delivery", "SLA", "service level agreement", "supplier monitoring",
            "vendor performance"
        )),

        // A.16 - Information Security Incident Management
        Map.entry("A.16.1", Arrays.asList(
            "incident management", "incident response", "security incident",
            "incident reporting", "incident handling", "CSIRT", "SOC"
        )),

        // A.17 - Business Continuity Management
        Map.entry("A.17.1", Arrays.asList(
            "business continuity", "continuity planning", "BCP", "disaster recovery",
            "RTO", "RPO", "recovery time objective", "recovery point objective"
        )),
        Map.entry("A.17.2", Arrays.asList(
            "redundancy", "high availability", "failover", "redundant systems",
            "backup site", "hot site", "cold site"
        )),

        // A.18 - Compliance
        Map.entry("A.18.1", Arrays.asList(
            "legal compliance", "regulatory compliance", "statutory requirements",
            "legal requirements", "compliance monitoring"
        )),
        Map.entry("A.18.2", Arrays.asList(
            "security review", "independent review", "compliance audit",
            "security audit", "audit findings"
        ))
    );

    // ══════════════════════════════════════════════════════════════════════════
    // SOC 2 CONTROL KEYWORDS
    // ══════════════════════════════════════════════════════════════════════════

    private static final Map<String, List<String>> SOC2_KEYWORDS = Map.ofEntries(
        
        // CC1 - Control Environment
        Map.entry("CC1.1", Arrays.asList(
            "code of conduct", "ethics", "integrity", "ethical behavior",
            "corporate values", "tone at the top"
        )),
        Map.entry("CC1.2", Arrays.asList(
            "board oversight", "governance", "board of directors",
            "executive oversight", "governance structure"
        )),
        Map.entry("CC1.3", Arrays.asList(
            "organizational structure", "reporting structure", "authority",
            "responsibility assignment"
        )),
        Map.entry("CC1.4", Arrays.asList(
            "competence", "training", "skills", "knowledge",
            "professional development", "certification"
        )),
        Map.entry("CC1.5", Arrays.asList(
            "accountability", "performance evaluation", "consequences",
            "disciplinary action"
        )),

        // CC2 - Communication and Information
        Map.entry("CC2.1", Arrays.asList(
            "communication", "information system", "data quality",
            "information requirements"
        )),
        Map.entry("CC2.2", Arrays.asList(
            "internal communication", "communication channel",
            "information flow", "stakeholder communication"
        )),

        // CC3 - Risk Assessment
        Map.entry("CC3.1", Arrays.asList(
            "risk assessment", "risk identification", "risk analysis",
            "risk evaluation", "threat assessment"
        )),
        Map.entry("CC3.2", Arrays.asList(
            "fraud risk", "fraud assessment", "fraud prevention",
            "fraud detection", "anti-fraud"
        )),
        Map.entry("CC3.3", Arrays.asList(
            "change management", "organizational change", "system change",
            "change impact", "change control"
        )),

        // CC4 - Monitoring Activities
        Map.entry("CC4.1", Arrays.asList(
            "continuous monitoring", "control monitoring", "performance monitoring",
            "KPI", "metrics", "key performance indicator"
        )),
        Map.entry("CC4.2", Arrays.asList(
            "deficiency", "control deficiency", "remediation",
            "corrective action", "improvement"
        )),

        // CC5 - Control Activities
        Map.entry("CC5.1", Arrays.asList(
            "access control", "user access", "authorization",
            "authentication", "least privilege"
        )),
        Map.entry("CC5.2", Arrays.asList(
            "system operations", "job scheduling", "batch processing",
            "operational control"
        )),
        Map.entry("CC5.3", Arrays.asList(
            "change management", "change control", "change approval",
            "change testing", "rollback"
        )),

        // CC6 - Logical and Physical Access
        Map.entry("CC6.1", Arrays.asList(
            "access authorization", "access provisioning", "access request",
            "access approval", "identity management"
        )),
        Map.entry("CC6.2", Arrays.asList(
            "logical access", "system access", "network access",
            "application access"
        )),
        Map.entry("CC6.3", Arrays.asList(
            "access removal", "termination", "transfer",
            "access deprovisioning", "account deletion"
        )),
        Map.entry("CC6.4", Arrays.asList(
            "physical access", "facility access", "badge system",
            "visitor escort", "entry control"
        )),
        Map.entry("CC6.6", Arrays.asList(
            "multi-factor authentication", "MFA", "2FA", "two-factor",
            "authentication factor"
        )),
        Map.entry("CC6.7", Arrays.asList(
            "encryption", "data encryption", "transmission encryption",
            "storage encryption", "cryptographic"
        )),
        Map.entry("CC6.8", Arrays.asList(
            "encryption key", "key management", "key rotation",
            "key storage", "cryptographic key"
        )),

        // CC7 - System Operations
        Map.entry("CC7.1", Arrays.asList(
            "intrusion detection", "IDS", "IPS", "threat detection",
            "security monitoring", "anomaly detection"
        )),
        Map.entry("CC7.2", Arrays.asList(
            "security incident", "incident detection", "incident response",
            "incident notification", "breach notification"
        )),
        Map.entry("CC7.3", Arrays.asList(
            "security event", "security log", "event monitoring",
            "log analysis", "SIEM"
        )),
        Map.entry("CC7.4", Arrays.asList(
            "vulnerability", "vulnerability scanning", "penetration test",
            "security assessment", "vulnerability management"
        )),
        Map.entry("CC7.5", Arrays.asList(
            "patch", "software update", "security patch",
            "patch management", "update deployment"
        )),

        // CC8 - Change Management
        Map.entry("CC8.1", Arrays.asList(
            "change authorization", "change approval", "change request",
            "CAB", "change advisory board"
        ))
    );

    // ══════════════════════════════════════════════════════════════════════════
    // GDPR ARTICLE KEYWORDS
    // ══════════════════════════════════════════════════════════════════════════

    private static final Map<String, List<String>> GDPR_KEYWORDS = Map.ofEntries(
        
        Map.entry("Art.5", Arrays.asList(
            "lawfulness", "fairness", "transparency", "purpose limitation",
            "data minimization", "accuracy", "storage limitation",
            "integrity", "confidentiality", "accountability"
        )),
        Map.entry("Art.6", Arrays.asList(
            "legal basis", "consent", "contract", "legal obligation",
            "vital interests", "public task", "legitimate interests"
        )),
        Map.entry("Art.7", Arrays.asList(
            "consent", "freely given", "specific", "informed",
            "unambiguous", "opt-in", "consent withdrawal"
        )),
        Map.entry("Art.9", Arrays.asList(
            "special category", "sensitive data", "health data",
            "biometric", "genetic", "racial", "ethnic", "political opinion"
        )),
        Map.entry("Art.15", Arrays.asList(
            "right of access", "subject access request", "SAR",
            "data subject access", "copy of data"
        )),
        Map.entry("Art.16", Arrays.asList(
            "right to rectification", "correction", "inaccurate data",
            "incomplete data", "data correction"
        )),
        Map.entry("Art.17", Arrays.asList(
            "right to erasure", "right to be forgotten", "deletion",
            "data deletion", "erasure request"
        )),
        Map.entry("Art.20", Arrays.asList(
            "data portability", "transfer data", "machine-readable",
            "structured format", "export data"
        )),
        Map.entry("Art.21", Arrays.asList(
            "right to object", "objection", "direct marketing",
            "automated decision", "profiling"
        )),
        Map.entry("Art.25", Arrays.asList(
            "data protection by design", "privacy by design",
            "data protection by default", "privacy by default",
            "default settings", "pseudonymization"
        )),
        Map.entry("Art.28", Arrays.asList(
            "processor", "data processor", "sub-processor",
            "processing agreement", "DPA", "data processing agreement"
        )),
        Map.entry("Art.30", Arrays.asList(
            "records of processing", "ROPA", "processing activities",
            "processing register", "record keeping"
        )),
        Map.entry("Art.32", Arrays.asList(
            "security of processing", "appropriate security measures",
            "technical measures", "organizational measures",
            "encryption", "pseudonymization", "confidentiality"
        )),
        Map.entry("Art.33", Arrays.asList(
            "breach notification", "personal data breach",
            "supervisory authority", "72 hours", "breach reporting"
        )),
        Map.entry("Art.35", Arrays.asList(
            "DPIA", "data protection impact assessment",
            "privacy impact assessment", "PIA", "impact assessment"
        )),
        Map.entry("Art.37", Arrays.asList(
            "DPO", "data protection officer", "privacy officer",
            "DPO designation", "DPO contact"
        ))
    );

    // ══════════════════════════════════════════════════════════════════════════
    // HIPAA SAFEGUARD KEYWORDS
    // ══════════════════════════════════════════════════════════════════════════

    private static final Map<String, List<String>> HIPAA_KEYWORDS = Map.ofEntries(
        
        // Administrative Safeguards
        Map.entry("164.308(a)(1)", Arrays.asList(
            "security management", "risk analysis", "risk management",
            "sanction policy", "information system activity review"
        )),
        Map.entry("164.308(a)(2)", Arrays.asList(
            "security official", "security responsibility",
            "designated security officer"
        )),
        Map.entry("164.308(a)(3)", Arrays.asList(
            "workforce security", "authorization", "workforce clearance",
            "termination procedures", "access authorization"
        )),
        Map.entry("164.308(a)(4)", Arrays.asList(
            "access management", "access authorization",
            "access establishment", "access modification"
        )),
        Map.entry("164.308(a)(5)", Arrays.asList(
            "security awareness", "security training",
            "security reminders", "protection from malicious software",
            "login monitoring", "password management"
        )),
        Map.entry("164.308(a)(6)", Arrays.asList(
            "security incident", "incident procedures",
            "incident response", "incident reporting"
        )),
        Map.entry("164.308(a)(7)", Arrays.asList(
            "contingency plan", "data backup", "disaster recovery",
            "emergency mode", "testing", "applications and data criticality"
        )),
        Map.entry("164.308(a)(8)", Arrays.asList(
            "evaluation", "security evaluation",
            "periodic technical and nontechnical evaluation"
        )),
        Map.entry("164.308(b)(1)", Arrays.asList(
            "business associate", "BAA", "business associate agreement",
            "written contract", "third party"
        )),

        // Physical Safeguards
        Map.entry("164.310(a)(1)", Arrays.asList(
            "facility access", "physical access", "facility security plan",
            "access control and validation", "maintenance records"
        )),
        Map.entry("164.310(b)", Arrays.asList(
            "workstation use", "workstation security",
            "workstation policy", "physical safeguards"
        )),
        Map.entry("164.310(c)", Arrays.asList(
            "workstation security", "workstation physical safeguards"
        )),
        Map.entry("164.310(d)(1)", Arrays.asList(
            "device and media", "disposal", "media reuse",
            "accountability", "data backup and storage"
        )),

        // Technical Safeguards
        Map.entry("164.312(a)(1)", Arrays.asList(
            "access control", "unique user identification",
            "emergency access", "automatic logoff", "encryption and decryption"
        )),
        Map.entry("164.312(b)", Arrays.asList(
            "audit controls", "audit log", "audit trail",
            "logging and monitoring"
        )),
        Map.entry("164.312(c)(1)", Arrays.asList(
            "integrity", "data integrity", "authentication",
            "electronic signature"
        )),
        Map.entry("164.312(d)", Arrays.asList(
            "person or entity authentication", "authentication",
            "identity verification", "user authentication"
        )),
        Map.entry("164.312(e)(1)", Arrays.asList(
            "transmission security", "integrity controls",
            "encryption", "transmission encryption"
        ))
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Get keywords for a specific control code.
     * 
     * @param frameworkName Framework name (ISO27001, SOC2, GDPR, HIPAA)
     * @param controlCode   Control code (e.g., "A.10.1", "CC6.7", "Art.32")
     * @return List of keywords, or empty list if not found
     */
    public static List<String> getKeywords(String frameworkName, String controlCode) {
        Map<String, List<String>> dictionary = getDictionary(frameworkName);
        return dictionary.getOrDefault(controlCode, Collections.emptyList());
    }

    /**
     * Get all control codes for a framework.
     * 
     * @param frameworkName Framework name
     * @return Set of all control codes
     */
    public static Set<String> getAllControlCodes(String frameworkName) {
        Map<String, List<String>> dictionary = getDictionary(frameworkName);
        return dictionary.keySet();
    }

    /**
     * Get the full dictionary for a framework.
     */
    private static Map<String, List<String>> getDictionary(String frameworkName) {
        return switch (frameworkName.toUpperCase()) {
            case "ISO27001", "ISO 27001" -> ISO27001_KEYWORDS;
            case "SOC2", "SOC 2" -> SOC2_KEYWORDS;
            case "GDPR" -> GDPR_KEYWORDS;
            case "HIPAA" -> HIPAA_KEYWORDS;
            default -> Collections.emptyMap();
        };
    }

    /**
     * Check if a framework is supported.
     */
    public static boolean isFrameworkSupported(String frameworkName) {
        return switch (frameworkName.toUpperCase()) {
            case "ISO27001", "ISO 27001", "SOC2", "SOC 2", "GDPR", "HIPAA" -> true;
            default -> false;
        };
    }
}
