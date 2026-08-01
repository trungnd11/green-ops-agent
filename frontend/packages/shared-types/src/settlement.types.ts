export type SettlementStatus =
  | 'pending'
  | 'awaiting_response'
  | 'approved'
  | 'complaint'
  | 'processing'
  | 'completed';

export interface Settlement {
  id: string;
  periodId: string;
  periodName: string;
  driverId: string;
  driverName: string;
  totalRevenue: number;
  totalDeductions: number;
  netAmount: number;
  status: SettlementStatus;
  responseDeadline?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface SettlementSearchParams {
  page: number;
  pageSize: number;
  status?: SettlementStatus | 'all';
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
