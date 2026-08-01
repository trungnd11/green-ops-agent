export type AdjustmentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface Adjustment {
  id: string;
  code: string;
  driverId: string;
  driverName: string;
  periodId: string;
  type: 'plus' | 'minus';
  amount: number;
  reason: string;
  status: AdjustmentStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdjustmentSearchParams {
  page: number;
  pageSize: number;
  status?: AdjustmentStatus | 'all';
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
