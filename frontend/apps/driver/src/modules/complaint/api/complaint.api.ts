const BASE_URL = '/api/v1';

function getSession() {
  try {
    const raw = localStorage.getItem('xanhsm-driver-auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.token || ''}`,
  };
  if (session?.companyId) headers['X-Company-Id'] = session.companyId;
  const opts: RequestInit & { headers: Record<string, string> } = { method, headers };
  if (data !== undefined) opts.body = JSON.stringify(data);
  const res = await fetch(`${BASE_URL}${url}`, opts as RequestInit);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Yêu cầu thất bại');
  return json.data;
}

export interface Complaint {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  status: string;
  response?: string;
  respondedByName?: string;
  respondedAt?: string;
  createdAt: string;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchMyComplaints(page = 0, size = 20): Promise<PageResponse<Complaint>> {
  return request<PageResponse<Complaint>>('GET', `/driver/complaints?page=${page}&size=${size}`);
}

export async function createComplaint(data: {
  category: string;
  title: string;
  description?: string;
  amount?: number;
}): Promise<Complaint> {
  return request<Complaint>('POST', '/driver/complaints', data);
}
