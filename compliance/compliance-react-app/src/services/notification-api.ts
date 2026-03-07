import apiClient from './api-client';

export interface ApiNotification {
  id:        string;
  type:      'CRITICAL_GAP' | 'HIGH_GAP' | 'RISK_CHANGE' | 'FRAMEWORK' | 'SYSTEM';
  title:     string;
  message:   string;
  linkPage:  string;
  read:      boolean;
  createdAt: string;
}

export const notificationAPI = {

  /** GET /api/v1/notifications */
  getAll: async (): Promise<ApiNotification[]> => {
    const { data } = await apiClient.get<ApiNotification[]>('/notifications');
    return data;
  },

  /** GET /api/v1/notifications/count */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ unread: number }>('/notifications/count');
    return data.unread;
  },

  /** PATCH /api/v1/notifications/:id/read */
  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /** PATCH /api/v1/notifications/read-all */
  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
