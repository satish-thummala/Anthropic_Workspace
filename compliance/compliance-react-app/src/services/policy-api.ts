import apiClient from './api-client';

// ── Request / Response shapes (mirror PolicyDTOs.java exactly) ────────────────

export type PolicyTypeId =
  | 'access_control'
  | 'incident_response'
  | 'data_protection'
  | 'acceptable_use'
  | 'business_continuity';

export type FrameworkCode = 'ISO27001' | 'SOC2' | 'GDPR' | 'HIPAA' | '';

export interface PolicyGenerateRequest {
  type:           PolicyTypeId;
  frameworkCode?: FrameworkCode | string;
  orgName?:       string;
}

export interface PolicyGenerateResponse {
  title:           string;
  content:         string;   // Full policy in Markdown
  policyType:      string;
  policyTypeLabel: string;
  framework:       string;
  orgName:         string;
  engine:          'groq' | 'local' | 'none';
  durationMs:      number;
  generatedAt:     string;
}

export interface PolicyTypeInfo {
  id:                   PolicyTypeId;
  label:                string;
  description:          string;
  compatibleFrameworks: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const policyAPI = {

  /**
   * POST /api/v1/ai/policy/generate
   *
   * Generates a complete compliance policy document.
   * Uses Groq LLM when available, structured template fallback otherwise.
   * Returns full Markdown content ready to render or download.
   */
  generate: async (req: PolicyGenerateRequest): Promise<PolicyGenerateResponse> => {
    const { data } = await apiClient.post<PolicyGenerateResponse>(
      '/ai/policy/generate',
      req,
    );
    return data;
  },

  /**
   * GET /api/v1/ai/policy/types
   * Returns all supported policy types for the type picker UI.
   */
  getTypes: async (): Promise<PolicyTypeInfo[]> => {
    const { data } = await apiClient.get<PolicyTypeInfo[]>('/ai/policy/types');
    return data;
  },
};
