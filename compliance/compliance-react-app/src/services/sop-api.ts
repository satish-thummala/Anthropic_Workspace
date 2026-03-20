import apiClient from './api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SopCategory =
  | 'security_policy' | 'data_protection' | 'acceptable_use'
  | 'incident_response' | 'access_control' | 'business_continuity'
  | 'hr_policy' | 'other';

export type TaskStatus = 'pending' | 'acknowledged' | 'approved' | 'rejected' | 'overdue';
export type TaskType   = 'acknowledge' | 'approve' | 'complete_training';

export interface ApiSopDocument {
  id:               string;
  title:            string;
  description:      string | null;
  version:          string;
  category:         SopCategory;
  content:          string | null;
  frameworkCodes:   string | null;
  dueDays:          number;
  requiresApproval: boolean;
  isActive:         boolean;
  createdById:      number | null;
  createdByName:    string | null;
  createdAt:        string;
  totalAssigned:    number;
  totalAcknowledged: number;
  totalPending:     number;
  totalOverdue:     number;
}

export interface ApiSopTask {
  id:               string;
  sopId:            string;
  sopTitle:         string;
  sopVersion:       string;
  sopCategory:      SopCategory;
  sopContent:       string | null;
  requiresApproval: boolean;
  assignedToId:     number;
  assignedToName:   string;
  assignedToEmail:  string;
  assignedById:     number | null;
  assignedByName:   string | null;
  status:           TaskStatus;
  taskType:         TaskType;
  signedAt:         string | null;
  signatureNote:    string | null;
  rejectionReason:  string | null;
  dueDate:          string;
  assignedAt:       string;
  isOverdue:        boolean;
  daysUntilDue:     number;
}

export interface SopStats {
  totalSops:        number;
  activeSops:       number;
  totalTasks:       number;
  pendingTasks:     number;
  acknowledgedTasks: number;
  overdueTasks:     number;
  totalEmployees:   number;
}

export interface EmployeeInfo {
  id:               number;
  name:             string;
  email:            string;
  avatar:           string;
  pendingTaskCount: number;
}

export interface CreateSopRequest {
  title:            string;
  description?:     string;
  version?:         string;
  category?:        SopCategory;
  content?:         string;
  frameworkCodes?:  string;
  dueDays?:         number;
  requiresApproval?: boolean;
}

export interface UpdateSopRequest extends Partial<CreateSopRequest> {
  isActive?: boolean;
}

export interface AssignTaskRequest {
  employeeIds: number[];
  taskType?:   TaskType;
  dueDate?:    string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const sopAPI = {

  // ── SOP documents (compliance manager) ─────────────────────────────────────

  getAll: async (activeOnly = false): Promise<ApiSopDocument[]> => {
    const { data } = await apiClient.get<ApiSopDocument[]>('/sops', {
      params: { activeOnly },
    });
    return data;
  },

  getStats: async (): Promise<SopStats> => {
    const { data } = await apiClient.get<SopStats>('/sops/stats');
    return data;
  },

  getEmployees: async (): Promise<EmployeeInfo[]> => {
    const { data } = await apiClient.get<EmployeeInfo[]>('/sops/employees');
    return data;
  },

  getById: async (id: string): Promise<ApiSopDocument> => {
    const { data } = await apiClient.get<ApiSopDocument>(`/sops/${id}`);
    return data;
  },

  create: async (req: CreateSopRequest): Promise<ApiSopDocument> => {
    const { data } = await apiClient.post<ApiSopDocument>('/sops', req);
    return data;
  },

  update: async (id: string, req: UpdateSopRequest): Promise<ApiSopDocument> => {
    const { data } = await apiClient.put<ApiSopDocument>(`/sops/${id}`, req);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sops/${id}`);
  },

  getTasksBySop: async (sopId: string): Promise<ApiSopTask[]> => {
    const { data } = await apiClient.get<ApiSopTask[]>(`/sops/${sopId}/tasks`);
    return data;
  },

  assignTasks: async (sopId: string, req: AssignTaskRequest): Promise<ApiSopTask[]> => {
    const { data } = await apiClient.post<ApiSopTask[]>(`/sops/${sopId}/assign`, req);
    return data;
  },

  // ── Employee task actions ───────────────────────────────────────────────────

  getMyTasks: async (): Promise<ApiSopTask[]> => {
    const { data } = await apiClient.get<ApiSopTask[]>('/sops/my-tasks');
    return data;
  },

  acknowledge: async (taskId: string, note?: string): Promise<ApiSopTask> => {
    const { data } = await apiClient.post<ApiSopTask>(
      `/sops/tasks/${taskId}/acknowledge`, { note });
    return data;
  },

  approve: async (taskId: string, approved: boolean, note?: string): Promise<ApiSopTask> => {
    const { data } = await apiClient.post<ApiSopTask>(
      `/sops/tasks/${taskId}/approve`, { approved, note });
    return data;
  },
};
