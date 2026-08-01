import type { PaginationParams, SortParams } from './pagination.types';

export type DriverStatus = 'active' | 'inactive' | 'blocked' | 'pending_verification';

export interface Driver {
  id: string;
  code: string;
  displayName: string;
  phone: string;
  email?: string;
  status: DriverStatus;
  totalTrips: number;
  totalRevenue: number;
  rating: number;
  joinedAt: string;
  bankAccount?: DriverBankAccount;
}

export interface DriverBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isVerified: boolean;
}

export interface DriverSearchParams extends PaginationParams, SortParams {
  keyword?: string;
  status?: DriverStatus | 'all';
}
