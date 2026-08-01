export interface Settlement {
  id: string;
  settlementCode: string;
  periodId?: string;
  periodName?: string;
  totalDrivers: number;
  totalRevenue: number;
  totalDeduction: number;
  totalAddition: number;
  totalPayout: number;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementDetail {
  id: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  grossRevenue: number;
  totalDeduction: number;
  totalAddition: number;
  netPayable: number;
  currentDeposit: number;
  note?: string;
}
