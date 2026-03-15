import apiClient from './api-client';

// ── Response shapes (mirror GapDetectionDTOs.java exactly) ───────────────────

export interface GapDetectionSummary {
  totalControls:      number;
  coveredControls:    number;
  gapsDetected:       number;
  coveragePercentage: number;
}

export interface ControlMatchResult {
  controlId:       string;
  controlCode:     string;
  controlTitle:    string;
  covered:         boolean;
  confidence:      number;   // 0–100
  matchedKeywords: string[];
  reason:          string;
}

export interface FrameworkAnalysisResult {
  frameworkId:        string;
  frameworkName:      string;
  totalControls:      number;
  coveredControls:    number;
  gapsCreated:        number;
  coveragePercentage: number;
  controls:           ControlMatchResult[];
}

export interface GapDetectionResponse {
  success:      boolean;
  message:      string;
  documentId:   string;
  documentName: string;
  summary:      GapDetectionSummary | null;
  frameworks:   FrameworkAnalysisResult[];
  analyzedAt:   string | null;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const gapDetectionAPI = {

  /**
   * POST /api/v1/gap-detection/analyze/{documentId}
   *
   * Runs the NLP gap detection pipeline on the document's extracted text:
   *   1. Loads all controls for detected frameworks (ISO27001 / SOC2 / GDPR / HIPAA)
   *   2. Checks each control's keywords against document text
   *   3. Creates Gap records in the DB for any uncovered controls
   *   4. Returns full breakdown of what was covered vs missing
   *
   * Requires: document must have extracted_text (upload with Tika first).
   * Auth:     JWT Bearer token (handled automatically by apiClient interceptor).
   */
  analyzeDocument: async (documentId: string): Promise<GapDetectionResponse> => {
    const { data } = await apiClient.post<GapDetectionResponse>(
      `/gap-detection/analyze/${documentId}`
    );
    return data;
  },

  /**
   * GET /api/v1/gap-detection/status/{documentId}
   * Check if a document is ready to be analyzed.
   */
  getStatus: async (documentId: string): Promise<{ status: string; message: string }> => {
    const { data } = await apiClient.get(`/gap-detection/status/${documentId}`);
    return data;
  },
};
