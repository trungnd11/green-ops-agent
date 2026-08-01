import { createHttpClient } from "@xanh/api-client";
import { AUTH_STORAGE_KEY } from "@xanh/auth";

export interface RoleResponse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  permissions: { id: string; code: string; name: string }[];
}

export interface RoleUserResponse {
  userId: string;
  username: string;
  fullName: string;
  email: string;
}

export interface PermissionTreeResponse {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  permissions: { id: string; code: string; name: string }[];
  children: PermissionTreeResponse[];
}

import type { ApiResponse, PageResponse } from "../../../shared/api/api.types";

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).token ?? null;
  } catch {
    return null;
  }
}

function getCompanyId(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).companyId ?? null;
  } catch {
    return null;
  }
}

const client = createHttpClient({
  baseUrl: "/api/v1",
  timeout: 10_000,
  getAccessToken,
  getCompanyId,
});

export async function fetchRoles(
  params: {
    page?: number;
    size?: number;
    keyword?: string;
    type?: string;
    status?: string;
  } = {}
): Promise<PageResponse<RoleResponse>> {
  const companyId = getCompanyId();
  const queryParams: Record<string, unknown> = { page: params.page ?? 0, size: params.size ?? 10 };
  if (params.keyword) queryParams.keyword = params.keyword;
  if (params.status) queryParams.status = params.status;
  const res = await client.get<ApiResponse<PageResponse<RoleResponse>>>(`/companies/${companyId}/roles`, queryParams);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách vai trò");
  return res.data;
}

export async function fetchRole(id: string): Promise<RoleResponse> {
  const companyId = getCompanyId();
  const res = await client.get<ApiResponse<RoleResponse>>(`/companies/${companyId}/roles/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin vai trò");
  return res.data;
}

export async function createRole(data: {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}): Promise<RoleResponse> {
  const companyId = getCompanyId();
  const res = await client.post<ApiResponse<RoleResponse>>(`/companies/${companyId}/roles`, data);
  if (!res.success || !res.data) throw new Error(res.message || "Tạo vai trò thất bại");
  return res.data;
}

export async function updateRole(
  id: string,
  data: {
    name: string;
    description?: string;
    status: "ACTIVE" | "INACTIVE";
  }
): Promise<RoleResponse> {
  const companyId = getCompanyId();
  const res = await client.put<ApiResponse<RoleResponse>>(`/companies/${companyId}/roles/${id}`, data);
  if (!res.success || !res.data) throw new Error(res.message || "Cập nhật vai trò thất bại");
  return res.data;
}

export async function replaceRolePermissions(id: string, permissionIds: string[]): Promise<RoleResponse> {
  const companyId = getCompanyId();
  const res = await client.put<ApiResponse<RoleResponse>>(`/companies/${companyId}/roles/${id}/permissions`, {
    permissionIds,
  });
  if (!res.success || !res.data) throw new Error(res.message || "Cập nhật quyền thất bại");
  return res.data;
}

export async function deleteRole(id: string): Promise<void> {
  const companyId = getCompanyId();
  const res = await client.delete<ApiResponse<null>>(`/companies/${companyId}/roles/${id}`);
  if (!res.success) throw new Error(res.message || "Xóa vai trò thất bại");
}

export async function fetchRoleUsers(
  id: string,
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<RoleUserResponse>> {
  const companyId = getCompanyId();
  const queryParams: Record<string, unknown> = { page: params.page ?? 0, size: params.size ?? 10 };
  const res = await client.get<ApiResponse<PageResponse<RoleUserResponse>>>(
    `/companies/${companyId}/roles/${id}/users`,
    queryParams
  );
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách người dùng");
  return res.data;
}

export async function fetchPermissionTree(): Promise<PermissionTreeResponse[]> {
  const res = await client.get<ApiResponse<PermissionTreeResponse[]>>("/permissions/tree");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải cây quyền");
  return res.data;
}
