import { createHttpClient } from "@xanh/api-client";
import { AUTH_STORAGE_KEY } from "@xanh/auth";

export interface PermissionNode {
  id: string;
  code: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface ModuleTreeNode {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  permissions: PermissionNode[];
  children: ModuleTreeNode[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown;
}

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

export async function fetchPermissionTree(): Promise<ModuleTreeNode[]> {
  const res = await client.get<ApiResponse<ModuleTreeNode[]>>("/permissions/tree");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải cây quyền");
  return res.data;
}

export async function createModule(data: { code: string; name: string; description?: string; parentId?: string; moduleType: string; route?: string; icon?: string; displayOrder?: number }): Promise<void> {
  const res = await client.post<ApiResponse<null>>("/modules", data);
  if (!res.success) throw new Error(res.message || "Thêm module thất bại");
}

export async function updateModule(id: string, data: { code: string; name: string; description?: string; parentId?: string; moduleType: string; route?: string; icon?: string; displayOrder?: number; status?: string }): Promise<void> {
  const res = await client.put<ApiResponse<null>>(`/modules/${id}`, data);
  if (!res.success) throw new Error(res.message || "Cập nhật module thất bại");
}

export async function deleteModule(id: string): Promise<void> {
  const res = await client.delete<ApiResponse<null>>(`/modules/${id}`);
  if (!res.success) throw new Error(res.message || "Xóa module thất bại");
}

export async function createPermission(data: { moduleId: string; code: string; name: string; description?: string; resource: string; action: string; permissionType: string }): Promise<void> {
  const res = await client.post<ApiResponse<null>>("/permissions", data);
  if (!res.success) throw new Error(res.message || "Thêm quyền thất bại");
}

export async function updatePermission(id: string, data: { moduleId: string; code: string; name: string; description?: string; resource: string; action: string; permissionType: string; status?: string }): Promise<void> {
  const res = await client.put<ApiResponse<null>>(`/permissions/${id}`, data);
  if (!res.success) throw new Error(res.message || "Cập nhật quyền thất bại");
}

export async function deletePermission(id: string): Promise<void> {
  const res = await client.delete<ApiResponse<null>>(`/permissions/${id}`);
  if (!res.success) throw new Error(res.message || "Xóa quyền thất bại");
}
