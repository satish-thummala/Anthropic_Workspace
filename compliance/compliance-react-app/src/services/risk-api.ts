import apiClient from './api-client';
import type { ApiRiskScore, ApiRiskHistory } from '../types/compliance.types';

export const riskAPI = {

  /**
   * GET /api/v1/risk/score
   * Returns the most recent calculated score + all risk factors.
   * React: RiskPage gauge, risk factors panel, framework breakdown.
   */
  getScore: async (): Promise<ApiRiskScore> => {
    const { data } = await apiClient.get<ApiRiskScore>('/risk/score');
    return data;
  },

  /**
   * POST /api/v1/risk/recalculate
   * Computes a fresh score, saves a snapshot, returns result.
   * React: "Recalculate" button.
   */
  recalculate: async (): Promise<ApiRiskScore> => {
    const { data } = await apiClient.post<ApiRiskScore>('/risk/recalculate');
    return data;
  },

  /**
   * GET /api/v1/risk/history
   * All historical snapshots for the trend chart (oldest → newest).
   * React: LineChart in RiskPage + Dashboard mini-chart.
   */
  getHistory: async (): Promise<ApiRiskHistory> => {
    const { data } = await apiClient.get<ApiRiskHistory>('/risk/history');
    return data;
  },
};
