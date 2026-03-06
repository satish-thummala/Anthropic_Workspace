import apiClient from './api-client';
import type { ApiDocument, ApiDocumentStats } from '../types/compliance.types';

export const documentAPI = {

  /**
   * GET /api/v1/documents
   * All documents, newest-first. Optional ?keyword= for name search.
   * React: DocumentsPage table
   */
  getAll: async (keyword?: string): Promise<ApiDocument[]> => {
    const { data } = await apiClient.get<ApiDocument[]>('/documents', {
      params: keyword ? { keyword } : undefined,
    });
    return data;
  },

  /**
   * GET /api/v1/documents/stats
   * { total, analyzed, processing, queued, error }
   * React: Dashboard "Documents Ingested" stat card
   */
  getStats: async (): Promise<ApiDocumentStats> => {
    const { data } = await apiClient.get<ApiDocumentStats>('/documents/stats');
    return data;
  },

  /**
   * POST /api/v1/documents/upload
   * Registers a new document (metadata only — no file bytes).
   * React: drop zone / file picker
   */
  upload: async (payload: {
    name:           string;
    fileSizeBytes:  number;
    fileSizeLabel:  string;
    uploadedByName: string;
  }): Promise<ApiDocument> => {
    const { data } = await apiClient.post<ApiDocument>('/documents/upload', payload);
    return data;
  },

  /**
   * POST /api/v1/documents/{id}/analyze
   * Runs analysis: assigns frameworks + coverage score.
   * React: Play button on each row
   */
  analyze: async (id: string): Promise<ApiDocument> => {
    const { data } = await apiClient.post<ApiDocument>(`/documents/${id}/analyze`);
    return data;
  },

  /**
   * DELETE /api/v1/documents/{id}
   * React: Trash icon on each row
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
