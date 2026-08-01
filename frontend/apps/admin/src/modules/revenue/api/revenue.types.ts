export interface RevenuePeriod {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  source: string;
  status: string;
  note?: string;
  driverCount?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueDetail {
  id: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  totalRevenue: number;
  totalTrips: number;
  insuranceFee: number;
  nonCashFee: number;
  discountTax: number;
  penalty: number;
  otherCost: number;
  surcharge: number;
  bonus: number;
  otherIncome: number;
  tip: number;
  promotion: number;
  chargeRefund: number;
  totalDeduction: number;
  totalAddition: number;
  earnedAmount: number;
  note?: string;
}

export interface RevenueSearchParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDir?: string;
}
