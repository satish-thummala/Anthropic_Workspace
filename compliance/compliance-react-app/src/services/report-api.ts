// ============================================================================
// CORRECTED: src/services/report-api.ts
// ============================================================================
// This version imports types from compliance.types.ts (following your pattern)

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
      '/reports/generate',
      request
    );
    return data;
  },

  /**
   * GET /api/v1/reports/{id}/download
   * Download a report
   */
  download: async (id: string): Promise<{ filePath: string; message: string }> => {
    const { data } = await apiClient.get(`/reports/${id}/download`);
    return data;
  },

  /**
   * DELETE /api/v1/reports/{id}
   * Delete a report
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};

