export type CommissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommissionLog {
  id: string;
  periodId: string;
  periodName: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  referrerId: string;
  referrerName: string;
  revenueAmount: number;
  rate: number;
  commissionAmount: number;
  originalAmount?: number;
  adjustReason?: string;
  status: CommissionStatus;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface CommissionConfig {
  id?: string;
  userId?: string;
  driverId?: string;
  rate: number;
  note?: string;
}

export interface CommissionReviewRequest {
  action: 'approve' | 'adjust' | 'reject';
  adjustedAmount?: number;
  reason?: string;
}
