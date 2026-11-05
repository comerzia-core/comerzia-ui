export interface NotificationItem {
  reference: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string | null;
  isRead: boolean;
}

