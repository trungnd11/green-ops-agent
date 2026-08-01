import { createHttpClient } from "@xanh/api-client";
import { AUTH_STORAGE_KEY } from "@xanh/auth";

export interface CompanyResponse {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  contactPerson?: string;
  status?: string;
  createdAt?: string;
}

export interface MyCompanyResponse {
  id: string;
  code: string;
  name: string;
  defaultCompany: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

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

export async function fetchMyCompanies(): Promise<MyCompanyResponse[]> {
  const res = await client.get<ApiResponse<MyCompanyResponse[]>>("/me/companies");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách công ty");
  return res.data;
}

export async function fetchCompanies(
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<MyCompanyResponse>> {
  const res = await client.get<ApiResponse<MyCompanyResponse[]>>("/me/companies");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách công ty");
  const items = res.data;
  const total = items.length;
  const pg = params.page ?? 0;
  const sz = params.size ?? 10;
  return {
    content: items.slice(pg * sz, (pg + 1) * sz),
    totalElements: total,
    totalPages: Math.ceil(total / sz),
    size: sz,
    number: pg,
  };
}
