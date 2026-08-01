const BASE_URL = '/api/v1';

function getSession() {
  try {
    const raw = localStorage.getItem('xanhsm-driver-auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function request<T>(method: string, url: string): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session?.token || ''}`,
  };
  if (session?.companyId) headers['X-Company-Id'] = session.companyId;
  const opts: RequestInit & { headers: Record<string, string> } = { method, headers };
  const res = await fetch(`${BASE_URL}${url}`, opts as RequestInit);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Yêu cầu thất bại');
  return json.data;
}

export interface RevenuePeriod {
  periodName: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalTrips: number;
  earnedAmount: number;
  totalBalance: number;
  availableBalance: number;
}

export async function fetchRevenueHistory(keyword?: string): Promise<RevenuePeriod[]> {
  const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return request<RevenuePeriod[]>('GET', `/driver/revenue${params}`);
}
