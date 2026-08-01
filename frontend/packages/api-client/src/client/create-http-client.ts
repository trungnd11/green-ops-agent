import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { HttpClientConfig, HttpClient } from './http-client.types';

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const instance: AxiosInstance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout ?? 30_000,
    headers: {},
  });

  instance.interceptors.request.use((req) => {
    const token = config.getAccessToken?.();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    const companyId = config.getCompanyId?.();
    if (companyId) {
      req.headers['X-Company-Id'] = companyId;
    }
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        config.onUnauthorized?.();
      }
      const data = error.response?.data as any;
      const message = data?.message || error.message || "Yêu cầu thất bại";
      return Promise.reject(new Error(message));
    },
  );

  return {
    get: <T>(url: string, params?: Record<string, unknown>) =>
      instance.get<T>(url, { params }).then((r) => r.data),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.post<T>(url, data, config).then((r) => r.data),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.put<T>(url, data, config).then((r) => r.data),
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.patch<T>(url, data, config).then((r) => r.data),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      instance.delete<T>(url, config).then((r) => r.data),
  };
}
