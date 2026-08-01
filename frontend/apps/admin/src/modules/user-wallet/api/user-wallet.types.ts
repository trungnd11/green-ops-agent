import type { UserTransaction, UserBalance, UserWithdrawRequest } from '@xanh/shared-types';

export type { UserTransaction, UserBalance, UserWithdrawRequest };

export interface TransactionSearchParams {
  page?: number;
  size?: number;
}
