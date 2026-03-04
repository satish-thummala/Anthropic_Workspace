import apiClient from './api-client';
import type {
  ApiFrameworkSummary,
  ApiFrameworkDetail,
  ApiControl,
  MappingResult,
} from '../types/compliance.types';

export const frameworkAPI = {

  /** GET /api/v1/frameworks — all active framework cards */
  getAll: async (): Promise<ApiFrameworkSummary[]> => {
    const { data } = await apiClient.get<ApiFrameworkSummary[]>('/frameworks');
    return data;
  },

  /** GET /api/v1/frameworks/:code — full detail + controls */
  getDetail: async (code: string): Promise<ApiFrameworkDetail> => {
    const { data } = await apiClient.get<ApiFrameworkDetail>(`/frameworks/${code}`);
    return data;
  },

  /** GET /api/v1/frameworks/:code/controls  (optional filters) */
  getControls: async (
    code: string,
    filters?: { keyword?: string; severity?: string; category?: string; isCovered?: boolean; }
  ): Promise<ApiControl[]> => {
    const { data } = await apiClient.get<ApiControl[]>(
      `/frameworks/${code}/controls`, { params: filters }
    );
    return data;
  },

  /** GET /api/v1/frameworks/:code/controls/categories */
  getCategories: async (code: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(`/frameworks/${code}/controls/categories`);
    return data;
  },

  /** PATCH /api/v1/frameworks/:code/controls/:id/coverage */
  updateCoverage: async (
    frameworkCode: string,
    controlId: string,
    isCovered: boolean
  ): Promise<ApiControl> => {
    const { data } = await apiClient.patch<ApiControl>(
      `/frameworks/${frameworkCode}/controls/${controlId}/coverage`,
      { isCovered }
    );
    return data;
  },

  /**
   * POST /api/v1/frameworks/map-all
   * Runs the document-to-control mapping engine on the backend.
   * Returns updated framework summaries + a result summary so the
   * framework cards refresh immediately without a second API call.
   */
  mapAllDocuments: async (): Promise<MappingResult> => {
    const { data } = await apiClient.post<MappingResult>('/frameworks/map-all');
    return data;
  },
};
