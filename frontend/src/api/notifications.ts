import { apiClient } from './client';
import { NotificationResponse } from '@/types';

export const notificationsApi = {
  getNotifications: async (unreadOnly: boolean = false): Promise<NotificationResponse[]> => {
    const response = await apiClient.get<NotificationResponse[]>('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return response.data;
  },

  markNotificationRead: async (notificationId: number): Promise<NotificationResponse> => {
    const response = await apiClient.patch<NotificationResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
