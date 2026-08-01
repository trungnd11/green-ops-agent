import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBalance, fetchTransactions, requestWithdraw, approveWithdrawal, rejectWithdrawal } from "./user-wallet.api";

export const walletKeys = {
  all: ["user-wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: (page: number) => [...walletKeys.all, "transactions", page] as const,
};

export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: fetchBalance,
  });
}

export function useWalletTransactions(page = 0) {
  return useQuery({
    queryKey: walletKeys.transactions(page),
    queryFn: () => fetchTransactions(page),
  });
}

export function useRequestWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}

export function useRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWithdrawal(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });
}
