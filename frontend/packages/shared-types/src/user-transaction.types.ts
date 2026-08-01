export type UserTransactionType = 'commission' | 'withdrawal' | 'adjustment';
export type UserTransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface UserTransaction {
  id: string;
  userId: string;
  userName: string;
  transactionCode: string;
  transactionType: UserTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  status: UserTransactionStatus;
  rejectReason?: string;
  note?: string;
  createdAt: string;
  processedAt?: string;
  paidAt?: string;
}

export interface UserBalance {
  userId: string;
  userName: string;
  availableBalance: number;
}

export interface UserWithdrawRequest {
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  note?: string;
}
