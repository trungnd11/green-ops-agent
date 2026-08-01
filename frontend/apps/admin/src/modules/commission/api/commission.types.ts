import type { CommissionLog, CommissionConfig, CommissionReviewRequest } from '@xanh/shared-types';

export type { CommissionLog, CommissionConfig, CommissionReviewRequest };

export interface CommissionSearchParams {
  periodId?: string;
  status?: string;
  page?: number;
  size?: number;
}
