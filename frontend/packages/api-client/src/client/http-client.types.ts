export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  getAccessToken?: () => string | null;
  getCompanyId?: () => string | null;
  onUnauthorized?: () => void;
}

import type { AxiosRequestConfig } from 'axios';

export interface HttpClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
