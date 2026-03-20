// ============================================================================
// src/services/report-api.ts
// ============================================================================

import apiClient from './api-client';
import type {
  ApiReport,
  ApiReportStats,
  ApiReportTypeInfo,
  GenerateReportRequest,
  GenerateReportResponse,
} from '../types/compliance.types';

// ────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ────────────────────────────────────────────────────────────────────────────

export const reportAPI = {
  /**
   * GET /api/v1/reports
   * Get all reports
   */
  getAll: async (): Promise<ApiReport[]> => {
    const { data } = await apiClient.get<ApiReport[]>('/reports');
    return data;
  },

  /**
   * GET /api/v1/reports/stats
   * Get report statistics
   */
  getStats: async (): Promise<ApiReportStats> => {
    const { data } = await apiClient.get<ApiReportStats>('/reports/stats');
    return data;
  },

  /**
   * GET /api/v1/reports/types
   * Get available report types
   */
  getTypes: async (): Promise<ApiReportTypeInfo[]> => {
    const { data } = await apiClient.get<ApiReportTypeInfo[]>('/reports/types');
    return data;
  },

  /**
   * GET /api/v1/reports/{id}
   * Get single report
   */
  getById: async (id: string): Promise<ApiReport> => {
    const { data } = await apiClient.get<ApiReport>(`/reports/${id}`);
    return data;
  },

  /**
   * POST /api/v1/reports/generate
   * Generate a new report
   */
  generate: async (request: GenerateReportRequest): Promise<GenerateReportResponse> => {
    const { data } = await apiClient.post<GenerateReportResponse>(
      '/reports/generate', request);
    return data;
  },

  /**
   * GET /api/v1/reports/{id}/download
   * Backend generates a real .docx and streams it — browser saves it directly.
   */
  download: async (id: string, reportName: string): Promise<void> => {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    const blob     = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};
