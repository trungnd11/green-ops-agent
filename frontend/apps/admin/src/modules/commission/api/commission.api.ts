import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { CommissionLog, CommissionReviewRequest, CommissionSearchParams } from "./commission.types";

export type { CommissionLog, CommissionSearchParams };

export async function fetchCommissions(params: CommissionSearchParams = {}): Promise<LegacyPageResponse<CommissionLog>> {
  const queryParams: Record<string, unknown> = {};
  if (params.periodId !== undefined) queryParams.periodId = params.periodId;
  if (params.status !== undefined) queryParams.status = params.status;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.size !== undefined) queryParams.size = params.size;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<CommissionLog>>>("/commissions", queryParams);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách hoa hồng");
  return res.data;
}

export async function reviewCommission(id: string, request: CommissionReviewRequest): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/commissions/${id}/review`, request);
  if (!res.success) throw new Error(res.message || "Xử lý hoa hồng thất bại");
}
