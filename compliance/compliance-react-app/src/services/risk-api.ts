import apiClient from './api-client';
import type { ApiRiskScore, ApiRiskHistory } from '../types/compliance.types';

// ── Risk Intelligence Types ────────────────────────────────────────────────

export interface RiskProjection {
  currentScore: number;
  projected30Days: number;
  projected60Days: number;
  projected90Days: number;
  confidence: 'high' | 'medium' | 'low';
  trendDirection: 'improving' | 'declining' | 'stable';
}

export interface RiskAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
  priority: number; // 1-5
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CriticalGap {
  gapId: string;
  controlCode: string;
  controlTitle: string;
  frameworkCode: string;
  severity: string;
  daysOpen: number;
  riskScore: number; // 0-100
  impactDescription: string;
}

export interface TrendPoint {
  date: string;
  score: number;
  gapsOpened: number;
  gapsClosed: number;
}

export interface RiskTrend {
  direction: 'improving' | 'declining' | 'stable';
  changePercentage: number; // -100 to +100
  period: string;
  history: TrendPoint[];
}

export interface RiskIntelligenceResponse {
  projection: RiskProjection;
  alerts: RiskAlert[];
  criticalGaps: CriticalGap[];
  trend: RiskTrend;
}

// ── Risk API ───────────────────────────────────────────────────────────────

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

  // ── Risk Intelligence Endpoints ──────────────────────────────────────────

  /**
   * GET /api/v1/risk-intelligence
   * Get comprehensive risk intelligence analytics
   * Returns: projection, alerts, critical gaps, and trend analysis
   */
  getIntelligence: async (): Promise<RiskIntelligenceResponse> => {
    const { data } = await apiClient.get<RiskIntelligenceResponse>('/risk-intelligence');
    return data;
  },

  /**
   * GET /api/v1/risk-intelligence/projection
   * Get risk score projection for next 30/60/90 days
   */
  getProjection: async (): Promise<RiskProjection> => {
    const { data } = await apiClient.get<RiskProjection>('/risk-intelligence/projection');
    return data;
  },

  /**
   * GET /api/v1/risk-intelligence/alerts
   * Get active risk alerts (critical gaps, low scores, aging gaps, etc.)
   */
  getAlerts: async (): Promise<RiskAlert[]> => {
    const { data } = await apiClient.get<RiskAlert[]>('/risk-intelligence/alerts');
    return data;
  },

  /**
   * GET /api/v1/risk-intelligence/critical-gaps
   * Get critical and high-risk gaps that need immediate attention
   */
  getCriticalGaps: async (): Promise<CriticalGap[]> => {
    const { data } = await apiClient.get<CriticalGap[]>('/risk-intelligence/critical-gaps');
    return data;
  },

  /**
   * GET /api/v1/risk-intelligence/trend
   * Get risk trend analysis with historical data
   */
  getTrend: async (): Promise<RiskTrend> => {
    const { data } = await apiClient.get<RiskTrend>('/risk-intelligence/trend');
    return data;
  },
};
