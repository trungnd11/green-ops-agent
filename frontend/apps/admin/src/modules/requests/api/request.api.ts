import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { DriverTransaction } from "./request.types";

export type { DriverTransaction };

export async function fetchTransactions(type: string, status: string, page = 0, size = 20, startDate?: string, endDate?: string, keyword?: string): Promise<LegacyPageResponse<DriverTransaction>> {
  const params: Record<string, unknown> = { type, status, page, size };
  if (startDate) params.startDate = startDate + 'T00:00:00';
  if (endDate) params.endDate = endDate + 'T23:59:59';
  if (keyword) params.keyword = keyword;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<DriverTransaction>>>("/transactions", params);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách giao dịch");
  return res.data;
}

export async function approveTransaction(id: string, adminId: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/transactions/${id}/approve?adminId=${adminId}`);
  if (!res.success) throw new Error(res.message || "Duyệt thất bại");
}

export async function rejectTransaction(id: string, adminId: string, reason?: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/transactions/${id}/reject?adminId=${adminId}`, { reason });
  if (!res.success) throw new Error(res.message || "Từ chối thất bại");
}
