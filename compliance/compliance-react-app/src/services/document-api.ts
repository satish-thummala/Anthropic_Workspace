import apiClient from "./api-client";
import type { ApiDocument } from "../types/compliance.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiDocumentStats {
  total:      number;
  analyzed:   number;
  processing: number;
  queued:     number;
  error:      number;
}

export interface UploadDocumentMeta {
  name?:         string;
  description?:  string;
  type?:         string;  // policy | procedure | evidence | other
  frameworkIds?: string;  // comma-separated e.g. "ISO27001,SOC2"
}

// ── API client ────────────────────────────────────────────────────────────────

export const documentAPI = {

  /**
   * GET /api/v1/documents
   * All documents, newest-first. Optional ?keyword= for name search.
   */
  getAll: async (keyword?: string): Promise<ApiDocument[]> => {
    const { data } = await apiClient.get<ApiDocument[]>("/documents", {
      params: keyword ? { keyword } : undefined,
    });
    return data;
  },

  /**
   * GET /api/v1/documents/stats
   * { total, analyzed, processing, queued, error }
   */
  getStats: async (): Promise<ApiDocumentStats> => {
    const { data } = await apiClient.get<ApiDocumentStats>("/documents/stats");
    return data;
  },

  /**
   * POST /api/v1/documents/upload  (multipart/form-data)
   *
   * Sends the real file bytes + optional metadata.
   * The backend will:
   *   1. Store the file (Cloudinary or local)
   *   2. Immediately run Apache Tika text extraction
   *   3. Map to compliance frameworks from real content
   *   4. Return status=analyzed if extraction succeeded, queued if it failed
   *
   * Usage:
   *   const doc = await documentAPI.uploadDocument(file, {
   *     type: 'policy',
   *     frameworkIds: 'ISO27001,SOC2',
   *   });
   */
  uploadDocument: async (
    file: File,
    meta: UploadDocumentMeta = {},
  ): Promise<ApiDocument> => {
    const form = new FormData();
    form.append("file", file);
    if (meta.name)         form.append("name",        meta.name);
    if (meta.description)  form.append("description", meta.description);
    if (meta.type)         form.append("type",        meta.type);
    if (meta.frameworkIds) form.append("frameworkIds", meta.frameworkIds);

    const { data } = await apiClient.post<ApiDocument>("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * POST /api/v1/documents/upload  (JSON metadata only — legacy)
   * Kept for backward compatibility. Prefer uploadDocument() for new code.
   */
  upload: async (req: {
    name:           string;
    fileSizeBytes:  number;
    fileSizeLabel:  string;
    uploadedByName: string;
  }): Promise<ApiDocument> => {
    const { data } = await apiClient.post<ApiDocument>("/documents/upload", req);
    return data;
  },

  /**
   * POST /api/v1/documents/{id}/analyze
   * Re-run Tika extraction on a stored document.
   * Use this to retry failed extractions or refresh framework mapping.
   */
  analyze: async (id: string): Promise<ApiDocument> => {
    const { data } = await apiClient.post<ApiDocument>(`/documents/${id}/analyze`);
    return data;
  },

  /**
   * DELETE /api/v1/documents/{id}
   * Deletes both the DB record and the stored file.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  /**
   * GET /api/v1/documents/{id}/download
   * Returns a direct download URL for the stored file.
   */
  getDownloadUrl: async (
    id: string,
  ): Promise<{ downloadUrl: string; filename: string }> => {
    const { data } = await apiClient.get(`/documents/${id}/download`);
    return data;
  },
};
