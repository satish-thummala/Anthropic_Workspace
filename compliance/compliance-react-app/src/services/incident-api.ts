import apiClient from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus   = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
export type IncidentType     =
  | 'data_breach' | 'unauthorised_access' | 'malware' | 'phishing'
  | 'policy_violation' | 'system_outage' | 'third_party_breach'
  | 'insider_threat' | 'other';

export interface ApiIncident {
  id:                   string;
  title:                string;
  description:          string | null;
  severity:             IncidentSeverity;
  incidentType:         IncidentType;
  status:               IncidentStatus;
  affectedSystems:      string | null;
  affectedFrameworks:   string | null;
  personalDataInvolved: boolean;
  recordsAffected:      number | null;
  rootCause:            string | null;
  correctiveActions:    string | null;
  lessonsLearned:       string | null;
  aiNarrative:          string | null;
  reportedById:         number | null;
  reportedByName:       string | null;
  assignedToId:         number | null;
  assignedToName:       string | null;
  regulatorNotified:    boolean;
  regulatorNotifiedAt:  string | null;
  individualsNotified:  boolean;
  detectedAt:           string | null;
  containedAt:          string | null;
  resolvedAt:           string | null;
  closedAt:             string | null;
  createdAt:            string;
  updatedAt:            string;
}

export interface IncidentStats {
  total:               number;
  active:              number;
  critical:            number;
  open:                number;
  investigating:       number;
  contained:           number;
  resolved:            number;
  closed:              number;
  personalDataBreaches: number;
}

export interface CreateIncidentRequest {
  title:                string;
  description?:         string;
  severity?:            IncidentSeverity;
  incidentType?:        IncidentType;
  affectedSystems?:     string;
  affectedFrameworks?:  string;
  personalDataInvolved?: boolean;
  recordsAffected?:     number;
  assignedToId?:        number;
}

export interface UpdateIncidentRequest {
  title?:               string;
  description?:         string;
  severity?:            IncidentSeverity;
  incidentType?:        IncidentType;
  status?:              IncidentStatus;
  affectedSystems?:     string;
  affectedFrameworks?:  string;
  personalDataInvolved?: boolean;
  recordsAffected?:     number;
  rootCause?:           string;
  correctiveActions?:   string;
  lessonsLearned?:      string;
  assignedToId?:        number;
  regulatorNotified?:   boolean;
  individualsNotified?: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const incidentAPI = {

  getAll: async (status?: string, severity?: string): Promise<ApiIncident[]> => {
    const { data } = await apiClient.get<ApiIncident[]>('/incidents', {
      params: { ...(status && { status }), ...(severity && { severity }) },
    });
    return data;
  },

  getStats: async (): Promise<IncidentStats> => {
    const { data } = await apiClient.get<IncidentStats>('/incidents/stats');
    return data;
  },

  getById: async (id: string): Promise<ApiIncident> => {
    const { data } = await apiClient.get<ApiIncident>(`/incidents/${id}`);
    return data;
  },

  create: async (req: CreateIncidentRequest): Promise<ApiIncident> => {
    const { data } = await apiClient.post<ApiIncident>('/incidents', req);
    return data;
  },

  update: async (id: string, req: UpdateIncidentRequest): Promise<ApiIncident> => {
    const { data } = await apiClient.put<ApiIncident>(`/incidents/${id}`, req);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/incidents/${id}`);
  },

  /** Generate AI narrative for the incident and save it to the record */
  generateReport: async (incidentId: string): Promise<{ text: string; engine: string; durationMs: number }> => {
    const { data } = await apiClient.post('/ai/insights/incident-report', { incidentId });
    return data;
  },

  /** Get the governance/executive summary */
  getGovernanceSummary: async (): Promise<{ text: string; engine: string; durationMs: number }> => {
    const { data } = await apiClient.get('/ai/insights/governance');
    return data;
  },
};
