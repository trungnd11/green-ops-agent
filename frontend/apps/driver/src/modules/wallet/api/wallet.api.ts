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
  const opts: Record<string, unknown> = { method, headers };
  if (data !== undefined) opts.body = JSON.stringify(data);
  const res = await fetch(`${BASE_URL}${url}`, opts as RequestInit);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Yêu cầu thất bại');
  return json.data;
}

export interface DashboardData {
  driverCode: string;
  fullName: string;
  phone: string;
  availableBalance: number;
  totalBalance: number;
  withdrawn: number;
  depositIn: number;
  latestPeriod?: string;
  latestRevenue?: number;
  latestTrips?: number;
  recentTransactions: TransactionItem[];
}

export interface TransactionItem {
  transactionCode: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  status: string;
  note?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>('GET', '/driver/dashboard');
}

export async function fetchTransactions(page = 0, size = 20, type?: string): Promise<TransactionItem[]> {
  let url = `/driver/transactions?page=${page}&size=${size}`;
  if (type) url += `&type=${type}`;
  const session = JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
  const headers: Record<string, string> = { Authorization: `Bearer ${session?.token || ''}` };
  if (session?.companyId) headers['X-Company-Id'] = session.companyId;
  const res = await fetch(`/api/v1${url}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Yêu cầu thất bại');
  return json.data || [];
}

export async function requestWithdraw(amount: number, bankInfo: string, note?: string): Promise<void> {
  return request<void>('POST', '/driver/withdraw', { amount, bankInfo, note });
}

export async function requestTopup(amount: number, paymentMethod?: string, note?: string): Promise<void> {
  return request<void>('POST', '/driver/topup', { amount, paymentMethod, note });
}
