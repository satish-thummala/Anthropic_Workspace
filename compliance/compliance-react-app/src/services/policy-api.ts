import apiClient from './api-client';
import type { ApiDocument } from '../types/compliance.types';

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

/** Request body for POST /api/v1/ai/policy/save */
export interface PolicySaveRequest {
  title:           string;
  content:         string;
  policyType:      string;
  policyTypeLabel: string;
  framework:       string;
  orgName:         string;
  engine:          string;
  savedByName?:    string;
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
   * POST /api/v1/ai/policy/save
   *
   * Saves a generated policy as a Document record.
   * The document will:
   *   - Appear in the Documents page (status = analyzed)
   *   - Have its text indexed (Tika runs on the markdown content)
   *   - Be available for gap detection to verify coverage
   *
   * Returns the created ApiDocument.
   */
  saveToDocuments: async (
    policy: PolicyGenerateResponse,
    savedByName?: string,
  ): Promise<ApiDocument> => {
    const req: PolicySaveRequest = {
      title:           policy.title,
      content:         policy.content,
      policyType:      policy.policyType,
      policyTypeLabel: policy.policyTypeLabel,
      framework:       policy.framework,
      orgName:         policy.orgName,
      engine:          policy.engine,
      savedByName,
    };
    const { data } = await apiClient.post<ApiDocument>('/ai/policy/save', req);
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
