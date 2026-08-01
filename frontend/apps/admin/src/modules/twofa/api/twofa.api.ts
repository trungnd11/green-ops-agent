import { createHttpClient } from "@xanh/api-client";
import { AUTH_STORAGE_KEY } from "@xanh/auth";

export interface TwoFAStatus {
  enabled: boolean;
  qrCodeUrl: string | null;
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

const client = createHttpClient({
  baseUrl: "/api/v1",
  timeout: 10_000,
  getAccessToken,
});

export async function fetch2FAStatus(): Promise<TwoFAStatus> {
  const res = await client.get<ApiResponse<TwoFAStatus>>("/2fa/status");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải trạng thái 2FA");
  return res.data;
}

export async function setup2FA(): Promise<TwoFAStatus> {
  const res = await client.post<ApiResponse<TwoFAStatus>>("/2fa/setup");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tạo secret 2FA");
  return res.data;
}

export async function enable2FA(otp: string): Promise<void> {
  const res = await client.post<ApiResponse<string>>("/2fa/enable", { otp });
  if (!res.success) throw new Error(res.message || "Bật 2FA thất bại");
}

export async function disable2FA(): Promise<void> {
  const res = await client.post<ApiResponse<string>>("/2fa/disable");
  if (!res.success) throw new Error(res.message || "Tắt 2FA thất bại");
}
