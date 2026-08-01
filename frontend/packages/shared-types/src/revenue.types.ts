export interface Revenue {
  id: string;
  periodId: string;
  driverId: string;
  driverName: string;
  totalRevenue: number;
  totalDeductions: number;
  totalAdditions: number;
  netAmount: number;
  tripCount: number;
  status: RevenueStatus;
  createdAt: string;
}

export interface RevenuePeriod {
  id: string;
  name: string;
  type: 'quarterly' | 'monthly';
  startDate: string;
  endDate: string;
  status: RevenueStatus;
  totalDriverCount: number;
  totalRevenue: number;
  totalSettlement: number;
}

export type RevenueStatus = 'draft' | 'locked' | 'settled' | 'closed';

export interface RevenueSearchParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: RevenueStatus | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
