import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettlements, fetchSettlement, fetchSettlementDetails, approveSettlement, paySettlement } from "./settlement.api";

export const settlementKeys = {
  all: ["settlements"] as const,
  list: (page: number, status?: string) => [...settlementKeys.all, "list", page, status] as const,
  detail: (id: string) => [...settlementKeys.all, "detail", id] as const,
  details: (id: string) => [...settlementKeys.all, "details", id] as const,
};

export function useSettlementList(status?: string, page = 0) {
  return useQuery({
    queryKey: settlementKeys.list(page, status),
    queryFn: () => fetchSettlements(page, status),
  });
}

export function useSettlement(id: string) {
  return useQuery({
    queryKey: settlementKeys.detail(id),
    queryFn: () => fetchSettlement(id),
  });
}

export function useSettlementDetails(id: string) {
  return useQuery({
    queryKey: settlementKeys.details(id),
    queryFn: () => fetchSettlementDetails(id),
  });
}

export function useApproveSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveSettlement,
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all }),
  });
}

export function usePaySettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paySettlement,
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementKeys.all }),
  });
}
