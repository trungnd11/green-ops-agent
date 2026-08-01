export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DepositRequest {
  id: string;
  code: string;
  driverId: string;
  driverName: string;
  amount: number;
  bankAccount: string;
  receiptImage?: string;
  status: RequestStatus;
  note?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  code: string;
  driverId: string;
  driverName: string;
  amount: number;
  bankAccount: string;
  status: RequestStatus;
  note?: string;
  createdAt: string;
}

export interface RequestSearchParams {
  page: number;
  pageSize: number;
  status?: RequestStatus | 'all';
  keyword?: string;
  type?: 'deposit' | 'withdrawal';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
