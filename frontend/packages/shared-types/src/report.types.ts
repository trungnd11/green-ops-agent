export type ReportType = 'revenue' | 'settlement' | 'complaint' | 'driver' | 'financial';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: 'xlsx' | 'csv' | 'pdf';
  createdAt: string;
  url?: string;
}

export interface ReportSearchParams {
  page: number;
  pageSize: number;
  type?: ReportType | 'all';
  keyword?: string;
}
