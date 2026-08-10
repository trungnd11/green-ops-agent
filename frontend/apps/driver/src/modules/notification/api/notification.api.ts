const BASE_URL = '/api/v1';

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  const session = JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.token || ''}`,
  };
  if (session?.companyId) headers['X-Company-Id'] = session.companyId;
  const opts: Record<string, unknown> = { method, headers };
  if (data !== undefined) opts.body = JSON.stringify(data);
  const res = await fetch(`${BASE_URL}${url}`, opts as RequestInit);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Yêu cầu thất bại');
  return json.data;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(page = 0, size = 20) {
  return request<{ items: Notification[]; totalElements: number }>('GET', `/driver/notifications?page=${page}&size=${size}`);
}

export async function fetchUnreadCount() {
  return request<{ count: number }>('GET', '/driver/notifications/unread-count');
}

export async function markAllRead() {
  return request<void>('POST', '/driver/notifications/mark-read');
}

export async function markRead(id: string) {
  return request<void>('POST', `/driver/notifications/${id}/mark-read`);
}
