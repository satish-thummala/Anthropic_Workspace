// ─── USER / AUTH ──────────────────────────────────────────────────────────────

export interface User {
  id?:           string;
  email:         string;
  name:          string;
  role:          string;
  org:           string;
  organization?: string;
  avatar:        string;
}

export interface UserWithPassword extends User {
  password: string;
}

// ─── FRAMEWORK  (local UI shape) ──────────────────────────────────────────────

export interface Framework {
  code:        string;
  name:        string;
  version:     string;
  controls:    number;
  covered:     number;
  color:       string;
  description: string;
}

// ─── FRAMEWORK API SHAPES (exact Spring Boot responses) ──────────────────────

export interface ApiFrameworkSummary {
  id:                 string;
  code:               string;
  name:               string;
  version:            string;
  description:        string;
  color:              string;
  totalControls:      number;
  coveredControls:    number;
  coveragePercentage: number;
  industry:           string;
  isActive:           boolean;
}

export interface ApiControl {
  id:                     string;
  frameworkCode:          string;
  code:                   string;
  title:                  string;
  description:            string | null;
  category:               string | null;
  severity:               'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  implementationGuidance: string | null;
  isCovered:              boolean;
  evidenceRequired:       string[];
  displayOrder:           number | null;
}

export interface ApiCategoryStats {
  category:           string;
  total:              number;
  covered:            number;
  coveragePercentage: number;
}

export interface ApiSeverityStats {
  severity: string;
  total:    number;
  covered:  number;
  gaps:     number;
}

export interface ApiFrameworkDetail extends ApiFrameworkSummary {
  publishedDate: string | null;
  byCategory:    ApiCategoryStats[];
  bySeverity:    ApiSeverityStats[];
  controls:      ApiControl[];
}

/** Map API summary → UI Framework shape (for components that use Framework) */
export function apiToFramework(a: ApiFrameworkSummary): Framework {
  return {
    code:        a.code,
    name:        a.name,
    version:     a.version,
    controls:    a.totalControls,
    covered:     a.coveredControls,
    color:       a.color,
    description: a.description,
  };
}

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

export type DocumentStatus = 'analyzed' | 'processing' | 'queued';

export interface ComplianceDocument {
  id:            number;
  name:          string;
  type:          string;
  size:          string;
  status:        DocumentStatus;
  uploadedAt:    string;
  frameworks:    string[];
  coverageScore: number | null;
}

// ─── GAP ──────────────────────────────────────────────────────────────────────

export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GapStatus   = 'open' | 'in_progress' | 'resolved';

export interface ComplianceGap {
  id:          number;
  control:     string;
  title:       string;
  framework:   string;
  severity:    GapSeverity;
  status:      GapStatus;
  description: string;
  suggestion:  string;
}

// ─── RISK ─────────────────────────────────────────────────────────────────────

export interface RiskHistoryPoint {
  month: string;
  score: number;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

export type ReportStatus = 'ready' | 'generating';

export interface ComplianceReport {
  id:        number;
  name:      string;
  generated: string;
  type:      string;
  format:    string;
  size:      string;
  status:    ReportStatus;
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

export type PageId = 'dashboard' | 'documents' | 'frameworks' | 'gaps' | 'risk' | 'reports';

export interface ToastMessage {
  id:   number;
  msg:  string;
  type: 'success' | 'error' | 'info';
}

export type ToastFn = (msg: string, type?: ToastMessage['type']) => void;
