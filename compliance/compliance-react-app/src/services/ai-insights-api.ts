import apiClient from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AiResponse {
  text:       string;
  feature:    'rank' | 'explain' | 'chat' | 'brief';
  engine:     'groq' | 'local';
  durationMs: number;
}

export interface AiStatusResponse {
  groqEnabled:       boolean;
  groqKeyConfigured: boolean;
  activeEngine:      'groq' | 'local';
  model:             string;
  message:           string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const aiInsightsAPI = {

  /** GET /ai/insights/status — which engine is active */
  getStatus: async (): Promise<AiStatusResponse> => {
    const { data } = await apiClient.get<AiStatusResponse>('/ai/insights/status');
    return data;
  },

  /**
   * POST /ai/insights/rank
   * Feature 1: Gap Priority Ranker
   */
  rankGaps: async (topN = 10): Promise<AiResponse> => {
    const { data } = await apiClient.post<AiResponse>('/ai/insights/rank', { topN });
    return data;
  },

  /**
   * POST /ai/insights/explain
   * Feature 2: Policy Gap Explainer — pass a specific gap ID
   */
  explainGap: async (gapId: string): Promise<AiResponse> => {
    const { data } = await apiClient.post<AiResponse>('/ai/insights/explain', { gapId });
    return data;
  },

  /**
   * POST /ai/insights/chat
   * Feature 3: Compliance Q&A Chatbot
   */
  chat: async (question: string): Promise<AiResponse> => {
    const { data } = await apiClient.post<AiResponse>('/ai/insights/chat', { question });
    return data;
  },

  /**
   * GET /ai/insights/brief
   * Feature 4: Executive Health Brief
   */
  executiveBrief: async (): Promise<AiResponse> => {
    const { data } = await apiClient.get<AiResponse>('/ai/insights/brief');
    return data;
  },
};
