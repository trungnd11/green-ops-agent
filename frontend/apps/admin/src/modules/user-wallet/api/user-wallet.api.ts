import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { UserBalance, UserTransaction, UserWithdrawRequest } from "./user-wallet.types";

export async function fetchBalance(): Promise<UserBalance> {
  const res = await httpClient.get<ApiResponse<UserBalance>>("/user-wallet/balance");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải số dư");
  return res.data;
}

export async function fetchTransactions(page = 0, size = 20): Promise<LegacyPageResponse<UserTransaction>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<UserTransaction>>>("/user-wallet/transactions", { page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải lịch sử giao dịch");
  return res.data;
}

export async function requestWithdraw(data: UserWithdrawRequest): Promise<UserTransaction> {
  const res = await httpClient.post<ApiResponse<UserTransaction>>("/user-wallet/withdraw", data);
  if (!res.success || !res.data) throw new Error(res.message || "Gửi yêu cầu rút tiền thất bại");
  return res.data;
}

export async function fetchPendingWithdrawals(page = 0, size = 20): Promise<LegacyPageResponse<UserTransaction>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<UserTransaction>>>("/user-wallet/withdrawals/pending", { page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách");
  return res.data;
}

export async function approveWithdrawal(id: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/user-wallet/withdrawals/${id}/approve`);
  if (!res.success) throw new Error(res.message || "Duyệt thất bại");
}

export async function rejectWithdrawal(id: string, reason: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/user-wallet/withdrawals/${id}/reject`, { reason });
  if (!res.success) throw new Error(res.message || "Từ chối thất bại");
}
