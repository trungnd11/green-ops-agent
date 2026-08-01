export type TransactionType = 'deposit' | 'withdrawal' | 'revenue' | 'adjustment' | 'penalty' | 'bonus';

export interface Transaction {
  id: string;
  driverId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  createdAt: string;
}
