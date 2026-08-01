export interface Complaint {
  id: string;
  driverId?: string;
  driverName?: string;
  driverCode?: string;
  settlementId?: string;
  settlementCode?: string;
  code: string;
  category: string;
  title: string;
  description?: string;
  amount: number;
  evidence?: string;
  status: string;
  response?: string;
  respondedByName?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface ComplaintStats {
  pending: number;
  processing: number;
  resolved: number;
  rejected: number;
}
