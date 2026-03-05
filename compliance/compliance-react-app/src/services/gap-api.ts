import apiClient from './api-client';
import type { ApiGap, ApiGapStats } from '../types/compliance.types';

export const gapAPI = {

  /**
   * GET /api/v1/gaps
   * All gaps with optional filters (all combinable):
   *   framework=ISO27001 | status=open | severity=CRITICAL | keyword=encryption
   */
  getAll: async (filters?: {
    framework?: string;
    status?:    string;
    severity?:  string;
    keyword?:   string;
  }): Promise<ApiGap[]> => {
    const { data } = await apiClient.get<ApiGap[]>('/gaps', { params: filters });
    return data;
  },

  /**
   * GET /api/v1/gaps/stats
   * Severity counters + per-framework breakdown for the stat cards.
   */
  getStats: async (): Promise<ApiGapStats> => {
    const { data } = await apiClient.get<ApiGapStats>('/gaps/stats');
    return data;
  },

  /**
   * GET /api/v1/gaps/:id
   * Single gap detail.
   */
  getById: async (id: string): Promise<ApiGap> => {
    const { data } = await apiClient.get<ApiGap>(`/gaps/${id}`);
    return data;
  },

  /**
   * PATCH /api/v1/gaps/:id/status
   * Move gap through workflow: open → in_progress → resolved | accepted_risk
   */
  updateStatus: async (
    id: string,
    status: string,
    remediationNotes?: string
  ): Promise<ApiGap> => {
    const { data } = await apiClient.patch<ApiGap>(`/gaps/${id}/status`, {
      status,
      remediationNotes: remediationNotes ?? null,
    });
    return data;
  },

  /**
   * PATCH /api/v1/gaps/:id/notes
   * Save remediation notes without changing status.
   */
  updateNotes: async (id: string, remediationNotes: string): Promise<ApiGap> => {
    const { data } = await apiClient.patch<ApiGap>(`/gaps/${id}/notes`, {
      remediationNotes,
    });
    return data;
  },
};
