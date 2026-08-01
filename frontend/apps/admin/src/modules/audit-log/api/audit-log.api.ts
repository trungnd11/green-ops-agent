import { createHttpClient } from "@xanh/api-client";
import { AUTH_STORAGE_KEY } from "@xanh/auth";

export interface AuditLogResponse {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName?: string;
  oldData?: Record<string, string> | null;
  newData?: Record<string, string> | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

import type { ApiResponse, PageResponse } from "../../../shared/api/api.types";

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  return getSession()?.token ?? null;
}

function getCompanyId(): string | null {
  return getSession()?.companyId ?? null;
}

const client = createHttpClient({
  baseUrl: "/api/v1",
  timeout: 10_000,
  getAccessToken,
  getCompanyId,
});

export async function fetchAuditLogs(
  params: {
    page?: number;
    size?: number;
    keyword?: string;
    actionType?: string;
    objectType?: string;
    fromDate?: string;
    toDate?: string;
    entityId?: string;
  } = {}
): Promise<PageResponse<AuditLogResponse>> {
  const companyId = getCompanyId();
  const queryParams: Record<string, unknown> = { page: params.page ?? 0, size: params.size ?? 20 };
  if (params.keyword) queryParams.keyword = params.keyword;
  if (params.actionType) queryParams.actionType = params.actionType;
  if (params.objectType) queryParams.objectType = params.objectType;
  if (params.fromDate) queryParams.fromDate = params.fromDate;
  if (params.toDate) queryParams.toDate = params.toDate;
  if (params.entityId) queryParams.entityId = params.entityId;
  const res = await client.get<ApiResponse<PageResponse<AuditLogResponse>>>(
    `/companies/${companyId}/audit-logs`,
    queryParams
  );
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải nhật ký");
  return res.data;
}
