import api from '../../../lib/axios';
import type { NotificationItem } from '../types/notification';

export const notificationService = {
  reconcile: async (): Promise<void> => { await api.post('/notifications/reconcile'); },
  /**
   * Retrieves active, un-dismissed notifications for the current user.
   */
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const { data } = await api.get<NotificationItem[]>('/notifications');
    if (!Array.isArray(data) || data.some(item => item === null || typeof item !== 'object'
      || typeof item.reference !== 'string' || typeof item.type !== 'string')) {
      throw new Error('Invalid personal notification response');
    }
    return data;
  },

  /**
   * Dismisses a notification so it won't appear again.
   */
  dismissNotification: async (reference: string): Promise<void> => {
    await api.post<void>(`/notifications/${encodeURIComponent(reference)}/dismiss`);
  },
};

