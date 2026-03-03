// ─── USER / AUTH ─────────────────────────────────────────────────────────────

export interface User {
  email: string;
  name: string;
  role: string;
  org: string;
  avatar: string;
}

// ─── FRAMEWORK ────────────────────────────────────────────────────────────────

export interface Framework {
  code: string;
  name: string;
  version: string;
  controls: number;
  covered: number;
  color: string;
  description: string;
}

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

export type DocumentStatus = 'analyzed' | 'processing' | 'queued';

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

export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GapStatus = 'open' | 'in_progress' | 'resolved';

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

export type ReportStatus = 'ready' | 'generating';

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

export type PageId = 'dashboard' | 'documents' | 'frameworks' | 'gaps' | 'risk' | 'reports';

export interface ToastMessage {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

export type ToastFn = (msg: string, type?: ToastMessage['type']) => void;
