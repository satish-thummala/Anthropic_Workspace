import apiClient from "./api-client";
import type { ApiDocument } from "../types/compliance.types";

// ── Document API ──────────────────────────────────────────────────────────────

export const documentAPI = {
  /**
   * OLD: Metadata-only upload (kept for backward compatibility)
   */
  upload: async (req: {
    name: string;
    fileSizeBytes: number;
    fileSizeLabel: string;
    uploadedByName: string;
  }): Promise<ApiDocument> => {
    const { data } = await apiClient.post("/documents/upload", req);
    return data;
  },

  /**
   * NEW: Real file upload with multipart/form-data
   */
  uploadDocument: async (
    file: File,
    metadata: {
      name?: string;
      description?: string;
      type?: string;
      frameworkIds?: string;
    },
  ): Promise<ApiDocument> => {
    const formData = new FormData();
    formData.append("file", file);

    // Add metadata fields
    if (metadata.name) formData.append("name", metadata.name);
    if (metadata.description)
      formData.append("description", metadata.description);
    if (metadata.type) formData.append("type", metadata.type);
    if (metadata.frameworkIds)
      formData.append("frameworkIds", metadata.frameworkIds);

    const { data } = await apiClient.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  /**
   * Get all documents with optional search
   */
  getAll: async (keyword?: string): Promise<ApiDocument[]> => {
    const params = keyword ? { keyword } : {};
    const { data } = await apiClient.get("/documents", { params });
    return data;
  },

  /**
   * Get single document by ID
   */
  getById: async (id: string): Promise<ApiDocument> => {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
  },

  /**
   * Analyze a document
   */
  analyze: async (id: string): Promise<ApiDocument> => {
    const { data } = await apiClient.post(`/documents/${id}/analyze`);
    return data;
  },

  /**
   * Delete a document
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  /**
   * Get download URL for a document
   */
  getDownloadUrl: async (
    id: string,
  ): Promise<{ downloadUrl: string; filename: string }> => {
    const { data } = await apiClient.get(`/documents/${id}/download`);
    return data;
  },

  /**
   * Get document statistics
   */
  getStats: async (): Promise<{
    total: number;
    analyzed: number;
    processing: number;
    queued: number;
    error: number;
  }> => {
    const { data } = await apiClient.get("/documents/stats");
    return data;
  },
};
