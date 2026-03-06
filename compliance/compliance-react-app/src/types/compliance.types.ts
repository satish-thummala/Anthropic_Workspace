// ─── USER / AUTH ──────────────────────────────────────────────────────────────

export interface User {
  id?: string;
  email: string;
  name: string;
  role: string;
  org: string;
  organization?: string;
  avatar: string;
}

export interface UserWithPassword extends User {
  password: string;
}

// ─── FRAMEWORK  (local UI shape) ──────────────────────────────────────────────

export interface Framework {
  code: string;
  name: string;
  version: string;
  controls: number;
  covered: number;
  color: string;
  description: string;
}

// ─── FRAMEWORK API SHAPES (exact Spring Boot responses) ──────────────────────

export interface ApiFrameworkSummary {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string;
  color: string;
  totalControls: number;
  coveredControls: number;
  coveragePercentage: number;
  industry: string;
  isActive: boolean;
}

export interface ApiControl {
  id: string;
  frameworkCode: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  implementationGuidance: string | null;
  isCovered: boolean;
  evidenceRequired: string[];
  displayOrder: number | null;
}

export interface ApiCategoryStats {
  category: string;
  total: number;
  covered: number;
  coveragePercentage: number;
}

export interface ApiSeverityStats {
  severity: string;
  total: number;
  covered: number;
  gaps: number;
}

export interface ApiFrameworkDetail extends ApiFrameworkSummary {
  publishedDate: string | null;
  byCategory: ApiCategoryStats[];
  bySeverity: ApiSeverityStats[];
  controls: ApiControl[];
}

/** Map API summary → UI Framework shape (for components that use Framework) */
export function apiToFramework(a: ApiFrameworkSummary): Framework {
  return {
    code: a.code,
    name: a.name,
    version: a.version,
    controls: a.totalControls,
    covered: a.coveredControls,
    color: a.color,
    description: a.description,
  };
}

// ─── MAPPING RESULT ───────────────────────────────────────────────────────────

export interface MappingResult {
  documentsProcessed: number;
  controlsUpdated: number;
  controlsAlreadyCovered: number;
  frameworksAffected: string[];
  updatedFrameworks: ApiFrameworkSummary[];
  message: string;
}

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

export type DocumentStatus = "analyzed" | "processing" | "queued";

export interface ComplianceDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  status: DocumentStatus;
  uploadedAt: string;
  frameworks: string[];
  coverageScore: number | null;
}

// ─── GAP ──────────────────────────────────────────────────────────────────────

export type GapSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type GapStatus = "open" | "in_progress" | "resolved";

export interface ComplianceGap {
  id: number;
  control: string;
  title: string;
  framework: string;
  severity: GapSeverity;
  status: GapStatus;
  description: string;
  suggestion: string;
}

// ─── RISK ─────────────────────────────────────────────────────────────────────

export interface RiskHistoryPoint {
  month: string;
  score: number;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

export type ReportStatus = "ready" | "generating";

export interface ComplianceReport {
  id: number;
  name: string;
  generated: string;
  type: string;
  format: string;
  size: string;
  status: ReportStatus;
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

export type PageId =
  | "dashboard"
  | "documents"
  | "frameworks"
  | "gaps"
  | "risk"
  | "reports"
  | "aiInsights";

export interface ToastMessage {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

export type ToastFn = (msg: string, type?: ToastMessage["type"]) => void;

// ─── API GAP SHAPES (Spring Boot /api/v1/gaps responses) ─────────────────────

export type ApiGapStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "accepted_risk";

export interface ApiGap {
  id: string;
  // Control
  controlId: string;
  controlCode: string;
  controlTitle: string;
  controlCategory: string | null;
  // Framework
  frameworkId: string;
  frameworkCode: string;
  frameworkName: string;
  frameworkColor: string;
  // Gap core
  gapType: string;
  severity: GapSeverity;
  status: ApiGapStatus;
  description: string | null;
  aiSuggestion: string | null;
  remediationNotes: string | null;
  priority: number;
  // Assignment
  assignedToId: number | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  // Timeline
  identifiedAt: string;
  assignedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  targetDate: string | null;
  // Metadata
  evidenceRequired: string[];
}

export interface ApiGapStats {
  totalOpen: number;
  totalInProgress: number;
  totalResolved: number;
  totalAcceptedRisk: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byFramework: ApiFrameworkGapCount[];
}

export interface ApiFrameworkGapCount {
  frameworkCode: string;
  frameworkName: string;
  frameworkColor: string;
  total: number;
  open: number;
  critical: number;
}

// ─── RISK API SHAPES (Spring Boot /api/v1/risk responses) ────────────────────

export interface ApiFrameworkRiskEntry {
  code: string;
  name: string;
  color: string;
  coveragePercentage: number;
  riskScore: number; // 100 - coveragePercentage
  riskLevel: string; // LOW | MEDIUM | HIGH | CRITICAL
  openGaps: number;
  criticalGaps: number;
}

export interface ApiRiskScore {
  score: number;
  riskLevel: string; // LOW | MEDIUM | HIGH | CRITICAL
  maturityLabel: string; // Initial | Developing | Establishing | Established | Optimizing
  maturityDescription: string;
  // Gap factors
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
  // Coverage
  totalControls: number;
  coveredControls: number;
  coveragePercentage: number;
  frameworksBelow70: number;
  // Breakdown
  byFramework: ApiFrameworkRiskEntry[];
  calculatedAt: string;
}

export interface ApiRiskHistoryPoint {
  month: string; // "Aug", "Sep" etc — X-axis label
  score: number;
  riskLevel: string;
  maturityLabel: string;
  calculatedAt: string;
}

export interface ApiRiskHistory {
  history: ApiRiskHistoryPoint[];
  currentScore: number;
  firstScore: number;
  improvement: number;
  period: string; // e.g. "7 months"
}

// ─── DOCUMENT API SHAPES (Spring Boot /api/v1/documents) ─────────────────────

export interface ApiDocument {
  id: string;
  name: string;
  type: string; // PDF | DOCX | XLSX | TXT
  size: string; // "2.4 MB"
  status: "queued" | "processing" | "analyzed" | "error";
  coverageScore: number | null;
  frameworks: string[]; // ["ISO27001","SOC2"]
  uploadedByName: string | null;
  uploadedAt: string; // "2026-02-14"
  analyzedAt: string | null;
}

export interface ApiDocumentStats {
  total: number;
  analyzed: number;
  processing: number;
  queued: number;
  error: number;
}

// ─── REPORT API SHAPES (Spring Boot /api/v1/reports) ─────────────────────

export type ApiReportType = 'gap' | 'coverage' | 'risk' | 'audit' | 'policy' | 'executive';
export type ApiReportFormat = 'PDF' | 'Excel' | 'Word';
export type ApiReportStatus = 'generating' | 'ready' | 'failed';

export interface ApiReport {
  id:               string;
  name:             string;
  type:             ApiReportType;
  format:           ApiReportFormat;
  fileSizeLabel:    string;
  status:           ApiReportStatus;
  errorMessage?:    string;
  generatedById?:   number;
  generatedByName?: string;
  generatedAt:      string;
  contentSummary?:  Record<string, any>;
  parameters?:      Record<string, any>;
}

export interface ApiReportStats {
  totalReports:      number;
  readyReports:      number;
  generatingReports: number;
  failedReports:     number;
  byType:            Record<string, number>;
  recentReports:     ApiReport[];
}

export interface ApiReportTypeInfo {
  id:               string;
  label:            string;
  description:      string;
  availableFormats: string[];
}

export interface GenerateReportRequest {
  type:            ApiReportType;
  format?:         ApiReportFormat;
  frameworkCode?:  string;
  severity?:       string;
  startDate?:      string;
  endDate?:        string;
  title?:          string;
  includeCharts?:  boolean;
  includeDetails?: boolean;
}

export interface GenerateReportResponse {
  reportId:         string;
  status:           string;
  message:          string;
  estimatedSeconds: number;
}
