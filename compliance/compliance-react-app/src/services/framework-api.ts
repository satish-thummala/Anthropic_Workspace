import apiClient from './api-client';
import type {
  ApiFrameworkSummary,
  ApiFrameworkDetail,
  ApiControl,
} from '../types/compliance.types';

// ─── FRAMEWORK ENDPOINTS ──────────────────────────────────────────────────────

export const frameworkAPI = {

  /**
   * GET /api/v1/frameworks
   * All active frameworks — used by Frameworks list page and Dashboard.
   */
  getAll: async (): Promise<ApiFrameworkSummary[]> => {
    const { data } = await apiClient.get<ApiFrameworkSummary[]>('/frameworks');
    return data;
  },

  /**
   * GET /api/v1/frameworks/:code
   * Full detail with controls + breakdown stats — used by View Details page.
   */
  getDetail: async (code: string): Promise<ApiFrameworkDetail> => {
    const { data } = await apiClient.get<ApiFrameworkDetail>(`/frameworks/${code}`);
    return data;
  },

  // ─── CONTROL ENDPOINTS ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/frameworks/:code/controls
   * Supports optional filters via query params.
   */
  getControls: async (
    code: string,
    filters?: {
      keyword?:   string;
      severity?:  string;
      category?:  string;
      isCovered?: boolean;
    }
  ): Promise<ApiControl[]> => {
    const { data } = await apiClient.get<ApiControl[]>(
      `/frameworks/${code}/controls`,
      { params: filters }
    );
    return data;
  },

  /**
   * GET /api/v1/frameworks/:code/controls/categories
   * Distinct category list for filter dropdown.
   */
  getCategories: async (code: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(`/frameworks/${code}/controls/categories`);
    return data;
  },

  /**
   * PATCH /api/v1/frameworks/:code/controls/:controlId/coverage
   * Toggle a control's isCovered flag — used by coverage checkbox.
   */
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
};
