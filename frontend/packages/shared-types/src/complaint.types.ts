export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export interface Complaint {
  id: string;
  code: string;
  driverId: string;
  driverName: string;
  settlementId: string;
  category: string;
  amount: number;
  description: string;
  evidence?: string[];
  status: ComplaintStatus;
  response?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ComplaintSearchParams {
  page: number;
  pageSize: number;
  status?: ComplaintStatus | 'all';
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
