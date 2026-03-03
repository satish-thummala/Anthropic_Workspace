import type {
  UserWithPassword,
  Framework,
  ComplianceDocument,
  ComplianceGap,
  RiskHistoryPoint,
  ComplianceReport,
} from "../types/compliance.types";

export const MOCK_USERS: UserWithPassword[] = [
  {
    email: "admin@techcorp.com",
    password: "Admin@123",
    name: "Sarah Chen",
    role: "Compliance Analyst",
    org: "Nirvahak Inc.",
    avatar: "SC",
  },
  {
    email: "manager@techcorp.com",
    password: "Manager@123",
    name: "James Patel",
    role: "Risk Manager",
    org: "Nirvahak Inc.",
    avatar: "JP",
  },
];

export const FRAMEWORKS: Framework[] = [
  {
    code: "ISO27001",
    name: "ISO 27001",
    version: "2022",
    controls: 93,
    covered: 71,
    color: "#3B82F6",
    description: "Information Security Management",
  },
  {
    code: "SOC2",
    name: "SOC 2 Type II",
    version: "2017",
    controls: 64,
    covered: 48,
    color: "#8B5CF6",
    description: "Service Organization Controls",
  },
  {
    code: "GDPR",
    name: "GDPR",
    version: "2018",
    controls: 42,
    covered: 38,
    color: "#10B981",
    description: "General Data Protection Regulation",
  },
  {
    code: "HIPAA",
    name: "HIPAA",
    version: "2013",
    controls: 54,
    covered: 29,
    color: "#F59E0B",
    description: "Health Insurance Portability",
  },
];

export const INITIAL_DOCUMENTS: ComplianceDocument[] = [
  {
    id: 1,
    name: "Information Security Policy.docx",
    type: "DOCX",
    size: "2.4 MB",
    status: "analyzed",
    uploadedAt: "2026-02-14",
    frameworks: ["ISO27001", "SOC2"],
    coverageScore: 82,
  },
  {
    id: 2,
    name: "Data Protection Policy.pdf",
    type: "PDF",
    size: "1.1 MB",
    status: "analyzed",
    uploadedAt: "2026-02-13",
    frameworks: ["GDPR"],
    coverageScore: 91,
  },
  {
    id: 3,
    name: "HR Employee Handbook.pdf",
    type: "PDF",
    size: "5.2 MB",
    status: "processing",
    uploadedAt: "2026-02-17",
    frameworks: [],
    coverageScore: null,
  },
  {
    id: 4,
    name: "IT Security Procedures.docx",
    type: "DOCX",
    size: "0.9 MB",
    status: "analyzed",
    uploadedAt: "2026-02-10",
    frameworks: ["ISO27001", "HIPAA"],
    coverageScore: 67,
  },
  {
    id: 5,
    name: "Business Continuity Plan.pdf",
    type: "PDF",
    size: "3.3 MB",
    status: "queued",
    uploadedAt: "2026-02-17",
    frameworks: [],
    coverageScore: null,
  },
];

export const INITIAL_GAPS: ComplianceGap[] = [
  {
    id: 1,
    control: "A.12.6.1",
    title: "Management of Technical Vulnerabilities",
    framework: "ISO27001",
    severity: "CRITICAL",
    status: "open",
    description:
      "No documented vulnerability scanning schedule or patch management policy found.",
    suggestion:
      "Implement quarterly vulnerability scanning with documented SLA for critical patches (<=7 days).",
  },
  {
    id: 2,
    control: "CC6.6",
    title: "Logical Access Security Measures",
    framework: "SOC2",
    severity: "HIGH",
    status: "in_progress",
    description:
      "Multi-factor authentication policy references exist but implementation evidence is missing.",
    suggestion:
      "Document MFA enforcement across all administrative accounts with audit logs as evidence.",
  },
  {
    id: 3,
    control: "Art.32",
    title: "Security of Processing",
    framework: "GDPR",
    severity: "HIGH",
    status: "open",
    description:
      "Encryption-at-rest policy not explicitly documented for EU customer data stores.",
    suggestion:
      "Add explicit data encryption standards section referencing AES-256 for stored PII.",
  },
  {
    id: 4,
    control: "164.312a",
    title: "Access Control",
    framework: "HIPAA",
    severity: "CRITICAL",
    status: "open",
    description:
      "PHI access control procedures are missing from all reviewed policy documents.",
    suggestion:
      "Create PHI Access Control Policy with role-based access matrix and quarterly review procedure.",
  },
  {
    id: 5,
    control: "A.9.4.2",
    title: "Secure Log-on Procedures",
    framework: "ISO27001",
    severity: "MEDIUM",
    status: "resolved",
    description:
      "Log-on procedure references general password policy but lacks account lockout specifics.",
    suggestion:
      "Add account lockout after 5 failed attempts and session timeout after 15 minutes of inactivity.",
  },
  {
    id: 6,
    control: "CC7.2",
    title: "System Monitoring",
    framework: "SOC2",
    severity: "MEDIUM",
    status: "open",
    description:
      "No evidence of continuous system monitoring procedures or alerting thresholds documented.",
    suggestion:
      "Document monitoring runbook with defined alert thresholds and escalation matrix.",
  },
  {
    id: 7,
    control: "Art.30",
    title: "Records of Processing Activities",
    framework: "GDPR",
    severity: "LOW",
    status: "in_progress",
    description:
      "Processing activity records are partially complete - missing third-party processor details.",
    suggestion:
      "Complete ROPA with all third-party data processors and their data transfer mechanisms.",
  },
];

export const RISK_HISTORY: RiskHistoryPoint[] = [
  { month: "Aug", score: 38 },
  { month: "Sep", score: 42 },
  { month: "Oct", score: 45 },
  { month: "Nov", score: 51 },
  { month: "Dec", score: 56 },
  { month: "Jan", score: 61 },
  { month: "Feb", score: 68 },
];

export const INITIAL_REPORTS: ComplianceReport[] = [
  {
    id: 1,
    name: "Q4 2025 ISO 27001 Gap Report",
    generated: "2026-01-15",
    type: "Gap Analysis",
    format: "PDF",
    size: "1.2 MB",
    status: "ready",
  },
  {
    id: 2,
    name: "GDPR Compliance Summary",
    generated: "2026-01-28",
    type: "Coverage Report",
    format: "PDF",
    size: "0.8 MB",
    status: "ready",
  },
  {
    id: 3,
    name: "SOC 2 Readiness Assessment",
    generated: "2026-02-05",
    type: "Readiness",
    format: "Excel",
    size: "2.1 MB",
    status: "ready",
  },
];
