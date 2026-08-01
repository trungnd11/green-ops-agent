import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { RevenuePeriod, RevenueDetail, RevenueSearchParams } from "./revenue.types";

export type { RevenuePeriod, RevenueDetail };

export async function fetchPeriods(params: RevenueSearchParams = {}): Promise<LegacyPageResponse<RevenuePeriod>> {
  const q: Record<string, unknown> = {};
  if (params.page !== undefined) q.page = params.page;
  if (params.size !== undefined) q.size = params.size;
  if (params.keyword) q.keyword = params.keyword;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.sortBy) q.sortBy = params.sortBy;
  if (params.sortDir) q.sortDir = params.sortDir;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<RevenuePeriod>>>("/revenue/periods", q);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách kỳ doanh thu");
  return res.data;
}

export async function fetchPeriod(id: string): Promise<RevenuePeriod> {
  const res = await httpClient.get<ApiResponse<RevenuePeriod>>(`/revenue/periods/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin kỳ doanh thu");
  return res.data;
}

export async function fetchPeriodDetails(periodId: string, params: RevenueSearchParams = {}): Promise<LegacyPageResponse<RevenueDetail>> {
  const q: Record<string, unknown> = {};
  if (params.page !== undefined) q.page = params.page;
  if (params.size !== undefined) q.size = params.size;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<RevenueDetail>>>(
    `/revenue/periods/${periodId}/details`, q);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải chi tiết doanh thu");
  return res.data;
}

export async function fetchDriverDetail(periodId: string, detailId: string): Promise<RevenueDetail> {
  const res = await httpClient.get<ApiResponse<RevenueDetail>>(`/revenue/periods/${periodId}/details/${detailId}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin doanh thu tài xế");
  return res.data;
}

export async function createPeriod(data: { name: string; type: string; startDate: string; endDate: string; note?: string }): Promise<RevenuePeriod> {
  const res = await httpClient.post<ApiResponse<RevenuePeriod>>("/revenue/periods", data);
  if (!res.success || !res.data) throw new Error(res.message || "Tạo kỳ doanh thu thất bại");
  return res.data;
}

export async function importRevenue(periodId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await httpClient.post<ApiResponse<void>>(`/revenue/periods/${periodId}/import`, formData, {
    timeout: 120_000,
  });
  if (!res.success) throw new Error(res.message || "Import thất bại");
}
