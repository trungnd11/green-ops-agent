import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { Complaint, ComplaintStats } from "./complaint.types";

export type { Complaint, ComplaintStats };

export async function fetchComplaints(status = "all", page = 0, size = 20): Promise<LegacyPageResponse<Complaint>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<Complaint>>>("/complaints", { status, page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách khiếu nại");
  return res.data;
}

export async function fetchComplaint(id: string): Promise<Complaint> {
  const res = await httpClient.get<ApiResponse<Complaint>>(`/complaints/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin khiếu nại");
  return res.data;
}

export async function fetchComplaintStats(): Promise<ComplaintStats> {
  const res = await httpClient.get<ApiResponse<ComplaintStats>>("/complaints/stats");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thống kê");
  return res.data;
}

export async function respondComplaint(id: string, action: string, response?: string): Promise<Complaint> {
  const res = await httpClient.post<ApiResponse<Complaint>>(`/complaints/${id}/respond`, { action, response });
  if (!res.success || !res.data) throw new Error(res.message || "Phản hồi thất bại");
  return res.data;
}
