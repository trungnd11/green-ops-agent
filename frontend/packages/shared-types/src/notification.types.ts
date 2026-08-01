export type NotificationType = 'settlement' | 'deposit' | 'withdrawal' | 'complaint' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationSearchParams {
  page: number;
  pageSize: number;
  type?: NotificationType | 'all';
  isRead?: boolean;
}
