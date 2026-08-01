import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse } from "../../../shared/api/api.types";
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  Verify2FARequest,
  TwoFAStatusResponse,
} from "./auth.types";

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await httpClient.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  if (!res.success || !res.data) throw new Error(res.message || "Đăng nhập thất bại");
  return res.data;
}

export async function verify2FAApi(payload: Verify2FARequest): Promise<LoginResponse> {
  const res = await httpClient.post<ApiResponse<LoginResponse>>("/auth/verify-2fa", payload);
  if (!res.success || !res.data) throw new Error(res.message || "Xác thực thất bại");
  return res.data;
}

export async function changePasswordApi(payload: ChangePasswordRequest): Promise<void> {
  const res = await httpClient.post<ApiResponse<string>>("/auth/change-password", payload);
  if (!res.success) throw new Error(res.message || "Đổi mật khẩu thất bại");
}

export async function fetch2FAStatusApi(): Promise<TwoFAStatusResponse> {
  const res = await httpClient.get<ApiResponse<TwoFAStatusResponse>>("/2fa/status");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải trạng thái 2FA");
  return res.data;
}

export async function setup2FAApi(): Promise<TwoFAStatusResponse> {
  const res = await httpClient.post<ApiResponse<TwoFAStatusResponse>>("/2fa/setup");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tạo secret 2FA");
  return res.data;
}

export async function enable2FAApi(otp: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<string>>("/2fa/enable", { otp });
  if (!res.success) throw new Error(res.message || "Bật 2FA thất bại");
}

export async function disable2FAApi(): Promise<void> {
  const res = await httpClient.post<ApiResponse<string>>("/2fa/disable");
  if (!res.success) throw new Error(res.message || "Tắt 2FA thất bại");
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  moduleType: string;
  route?: string;
  icon?: string;
  displayOrder: number;
  status: string;
  children: MenuItem[];
}

export async function fetchMenuApi(): Promise<MenuItem[]> {
  const res = await httpClient.get<ApiResponse<MenuItem[]>>("/me/menu");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải menu");
  return res.data;
}
