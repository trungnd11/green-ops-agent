export interface DriverTransaction {
  id: string;
  driverId?: string;
  driverCode?: string;
  driverName?: string;
  transactionCode: string;
  transactionType: string;
  amount: number;
  status: string;
  rejectReason?: string;
  note?: string;
  createdAt: string;
}
