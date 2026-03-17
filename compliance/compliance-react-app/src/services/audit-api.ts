import apiClient from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export type AuditAction =
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'LOGIN_FAILED' | 'TOKEN_REFRESHED'
  | 'GAP_STATUS_CHANGED' | 'GAP_ASSIGNED' | 'GAP_NOTES_UPDATED'
  | 'GAP_CREATED' | 'GAP_ANALYSIS_RUN'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_DELETED' | 'DOCUMENT_ANALYZED' | 'DOCUMENT_GAP_DETECTION'
  | 'POLICY_GENERATED' | 'POLICY_SAVED_TO_DOCS'
  | 'FRAMEWORK_COVERAGE_UPDATED'
  | 'REPORT_GENERATED'
  | 'RISK_RECALCULATED';

export interface AuditLogEntry {
  id:           string;
  userEmail:    string | null;
  userName:     string | null;
  action:       AuditAction;
  entityType:   string | null;
  entityId:     string | null;
  entityName:   string | null;
  description:  string | null;
  oldValue:     string | null;
  newValue:     string | null;
  outcome:      AuditOutcome;
  errorMessage: string | null;
  ipAddress:    string | null;
  createdAt:    string;  // ISO datetime
}

export interface AuditPage {
  content:          AuditLogEntry[];
  totalElements:    number;
  totalPages:       number;
  number:           number;   // current page (0-based)
  size:             number;
  first:            boolean;
  last:             boolean;
}

export interface AuditStats {
  totalEvents:       number;
  eventsLast24h:     number;
  eventsLast7d:      number;
  eventsLast30d:     number;
  activeUsersLast7d: number;
}

export interface AuditActionOption {
  value: AuditAction;
  label: string;
}

export interface AuditFilters {
  userEmail?:  string;
  action?:     string;
  entityType?: string;
  from?:       string;
  to?:         string;
  page?:       number;
  size?:       number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const auditAPI = {

  /**
   * GET /api/v1/audit
   * Paginated audit log with optional filters.
   */
  getLogs: async (filters: AuditFilters = {}): Promise<AuditPage> => {
    const { data } = await apiClient.get<AuditPage>('/audit', { params: filters });
    return data;
  },

  /**
   * GET /api/v1/audit/stats
   * Summary counts for the stat cards.
   */
  getStats: async (): Promise<AuditStats> => {
    const { data } = await apiClient.get<AuditStats>('/audit/stats');
    return data;
  },

  /**
   * GET /api/v1/audit/entity/{entityType}/{entityId}
   * Full event history for one entity (e.g. a specific gap).
   */
  getEntityHistory: async (entityType: string, entityId: string): Promise<AuditLogEntry[]> => {
    const { data } = await apiClient.get<AuditLogEntry[]>(
      `/audit/entity/${entityType}/${entityId}`
    );
    return data;
  },

  /**
   * GET /api/v1/audit/actions
   * List of all action types for the filter dropdown.
   */
  getActions: async (): Promise<AuditActionOption[]> => {
    const { data } = await apiClient.get<AuditActionOption[]>('/audit/actions');
    return data;
  },
};
