import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { DriverResponse, DriverSearchParams } from "./driver.types";

export type { DriverResponse, DriverSearchParams };

export async function fetchDrivers(params: DriverSearchParams = {}): Promise<LegacyPageResponse<DriverResponse>> {
  const queryParams: Record<string, unknown> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.size !== undefined) queryParams.size = params.size;
  if (params.search) queryParams.search = params.search;
  if (params.status && params.status !== "all") queryParams.status = params.status;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortDir) queryParams.sortDir = params.sortDir;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<DriverResponse>>>("/drivers", queryParams);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách tài xế");
  return res.data;
}

export async function fetchDriver(id: string): Promise<DriverResponse> {
  const res = await httpClient.get<ApiResponse<DriverResponse>>(`/drivers/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin tài xế");
  return res.data;
}

export async function createDriver(data: Record<string, unknown>): Promise<DriverResponse> {
  const res = await httpClient.post<ApiResponse<DriverResponse>>("/drivers", data);
  if (!res.success || !res.data) throw new Error(res.message || "Thêm tài xế thất bại");
  return res.data;
}

export async function fetchDriverStats(): Promise<Record<string, number>> {
  const res = await httpClient.get<ApiResponse<Record<string, number>>>("/drivers/stats");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thống kê");
  return res.data;
}

export async function updateDriver(id: string, data: Record<string, unknown>): Promise<DriverResponse> {
  const res = await httpClient.put<ApiResponse<DriverResponse>>(`/drivers/${id}`, data);
  if (!res.success || !res.data) throw new Error(res.message || "Cập nhật tài xế thất bại");
  return res.data;
}
