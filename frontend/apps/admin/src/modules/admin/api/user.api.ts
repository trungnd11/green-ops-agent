import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { UserResponse, UserSearchParams, UserCompanyResponse, BasicCompany, CompanyDetail, UserRolesResponse } from "./user.types";
import { authSessionService } from "../../auth/services/auth-session.service";

export type { UserResponse, UserSearchParams, UserCompanyResponse, BasicCompany };

export async function fetchUsers(params: UserSearchParams = {}): Promise<LegacyPageResponse<UserResponse>> {
  const queryParams: Record<string, unknown> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.size !== undefined) queryParams.size = params.size;
  if (params.keyword) queryParams.keyword = params.keyword;
  if (params.status) queryParams.status = params.status;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<UserResponse>>>("/users", queryParams);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách người dùng");
  return res.data;
}

export async function fetchUserStats(): Promise<Record<string, number>> {
  const res = await httpClient.get<ApiResponse<Record<string, number>>>("/users/stats");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thống kê");
  return res.data;
}

export async function fetchUserCompanies(id: string): Promise<UserCompanyResponse[]> {
  const res = await httpClient.get<ApiResponse<UserCompanyResponse[]>>(`/users/${id}/companies`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách công ty");
  return res.data;
}

export async function fetchAllCompanies(): Promise<BasicCompany[]> {
  const res = await httpClient.get<ApiResponse<BasicCompany[]>>("/companies");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách công ty");
  return res.data;
}

export async function fetchCompany(id: string): Promise<CompanyDetail> {
  const res = await httpClient.get<ApiResponse<CompanyDetail>>(`/companies/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin công ty");
  return res.data;
}

export async function createCompany(data: Partial<CompanyDetail>): Promise<CompanyDetail> {
  const res = await httpClient.post<ApiResponse<CompanyDetail>>("/companies", data);
  if (!res.success || !res.data) throw new Error(res.message || "Thêm công ty thất bại");
  return res.data;
}

export async function updateCompany(id: string, data: Partial<CompanyDetail>): Promise<CompanyDetail> {
  const res = await httpClient.put<ApiResponse<CompanyDetail>>(`/companies/${id}`, data);
  if (!res.success || !res.data) throw new Error(res.message || "Cập nhật công ty thất bại");
  return res.data;
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await httpClient.delete<ApiResponse<null>>(`/companies/${id}`);
  if (!res.success) throw new Error(res.message || "Xóa công ty thất bại");
}

export async function addUserToCompany(userId: string, companyId: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<null>>(`/companies/${companyId}/users`, { userId });
  if (!res.success) throw new Error(res.message || "Không thể thêm công ty");
}

export async function removeUserFromCompany(userId: string, companyId: string): Promise<void> {
  const res = await httpClient.delete<ApiResponse<null>>(`/companies/${companyId}/users/${userId}`);
  if (!res.success) throw new Error(res.message || "Không thể xoá công ty");
}

export async function fetchAllRoles(): Promise<{ id: string; code: string; name: string }[]> {
  const companyId = authSessionService.getCompanyId();
  if (!companyId) throw new Error("Không tìm thấy công ty");
  const res = await httpClient.get<ApiResponse<{ items: { id: string; code: string; name: string }[] }>>(`/companies/${companyId}/roles`, { size: "100" });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách vai trò");
  return res.data.items;
}

export async function replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
  const companyId = authSessionService.getCompanyId();
  if (!companyId) throw new Error("Không tìm thấy công ty");
  const res = await httpClient.put<ApiResponse<null>>(`/companies/${companyId}/users/${userId}/roles`, { roleIds });
  if (!res.success) throw new Error(res.message || "Phân quyền thất bại");
}

export async function fetchUserRoles(id: string): Promise<UserRolesResponse> {
  const res = await httpClient.get<ApiResponse<UserRolesResponse>>(`/users/${id}/roles`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải vai trò");
  return res.data;
}

export async function fetchUser(id: string): Promise<UserResponse> {
  const res = await httpClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin người dùng");
  return res.data;
}

export async function createUser(data: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  status?: string;
}): Promise<UserResponse> {
  const res = await httpClient.post<ApiResponse<UserResponse>>("/users", data);
  if (!res.success || !res.data) throw new Error(res.message || "Thêm người dùng thất bại");
  return res.data;
}

export async function updateUser(id: string, data: Record<string, string | undefined>): Promise<UserResponse> {
  const res = await httpClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
  if (!res.success || !res.data) throw new Error(res.message || "Cập nhật người dùng thất bại");
  return res.data;
}

export async function deactivateUser(id: string, reason?: string, note?: string): Promise<void> {
  const res = await httpClient.put<ApiResponse<null>>(`/users/${id}/deactivate`, { reason, note });
  if (!res.success) throw new Error(res.message || "Khóa tài khoản thất bại");
}

export async function deleteUser(id: string): Promise<void> {
  const res = await httpClient.delete<ApiResponse<null>>(`/users/${id}`);
  if (!res.success) throw new Error(res.message || "Xóa người dùng thất bại");
}
