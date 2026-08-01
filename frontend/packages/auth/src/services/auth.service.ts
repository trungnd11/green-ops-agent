import { createHttpClient } from '@xanh/api-client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  token: string;
  refreshToken: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  require2fa?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown;
}

let authHttpClient: ReturnType<typeof createHttpClient> | null = null;

export function initAuthService(baseUrl: string) {
  authHttpClient = createHttpClient({ baseUrl, timeout: 10_000 });
}

export async function loginApi(request: LoginRequest): Promise<LoginResponseData> {
  if (!authHttpClient) throw new Error('AuthService not initialized');

  const response = await authHttpClient.post<ApiResponse<LoginResponseData>>(
    '/auth/login',
    request,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Đăng nhập thất bại');
  }

  return response.data;
}

/* Driver login */

export interface DriverLoginRequest {
  identifier: string;
  companyId?: string;
}

export interface DriverLoginResponseData {
  driverId: string;
  driverCode: string;
  fullName: string;
  phone: string;
  token: string;
  companyId: string;
}

export async function driverLoginApi(request: DriverLoginRequest): Promise<DriverLoginResponseData> {
  if (!authHttpClient) throw new Error('AuthService not initialized');

  const response = await authHttpClient.post<ApiResponse<DriverLoginResponseData>>(
    '/driver/login',
    request,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Đăng nhập thất bại');
  }

  return response.data;
}
