import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTransactions, approveTransaction, rejectTransaction } from "./request.api";

export const requestKeys = {
  all: ["requests"] as const,
  list: (type: string, status: string, page: number, keyword?: string, startDate?: string, endDate?: string) =>
    [...requestKeys.all, type, status, page, keyword, startDate, endDate] as const,
};

export function useRequestList(type: string, status: string, page = 0, keyword?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: requestKeys.list(type, status, page, keyword, startDate, endDate),
    queryFn: () => fetchTransactions(type, status, page, 20, startDate, endDate, keyword),
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminId }: { id: string; adminId: string }) => approveTransaction(id, adminId),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.all }),
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminId, reason }: { id: string; adminId: string; reason?: string }) =>
      rejectTransaction(id, adminId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.all }),
  });
}
