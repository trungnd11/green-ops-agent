import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { Settlement, SettlementDetail } from "./settlement.types";

export type { Settlement, SettlementDetail };

export async function fetchSettlements(page = 0, status?: string): Promise<LegacyPageResponse<Settlement>> {
  const params: Record<string, unknown> = { page, size: 20 };
  if (status) params.status = status;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<Settlement>>>("/settlements", params);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách quyết toán");
  return res.data;
}

export async function fetchSettlement(id: string): Promise<Settlement> {
  const res = await httpClient.get<ApiResponse<Settlement>>(`/settlements/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin quyết toán");
  return res.data;
}

export async function fetchSettlementDetails(id: string): Promise<SettlementDetail[]> {
  const res = await httpClient.get<ApiResponse<SettlementDetail[]>>(`/settlements/${id}/details`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải chi tiết quyết toán");
  return res.data;
}

export async function approveSettlement(id: string): Promise<Settlement> {
  const res = await httpClient.post<ApiResponse<Settlement>>(`/settlements/${id}/approve`);
  if (!res.success || !res.data) throw new Error(res.message || "Duyệt thất bại");
  return res.data;
}

export async function paySettlement(id: string): Promise<Settlement> {
  const res = await httpClient.post<ApiResponse<Settlement>>(`/settlements/${id}/pay`);
  if (!res.success || !res.data) throw new Error(res.message || "Thanh toán thất bại");
  return res.data;
}
