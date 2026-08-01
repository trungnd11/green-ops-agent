import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCommissions, reviewCommission } from "./commission.api";
import { commissionKeys } from "../constants/query/commission";
import type { CommissionSearchParams, CommissionReviewRequest } from "./commission.types";

export const commissionQueries = {
  list: (params: CommissionSearchParams = {}) =>
    queryOptions({
      queryKey: commissionKeys.list(params as Record<string, unknown>),
      queryFn: () => fetchCommissions(params),
    }),
};

export function useReviewCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CommissionReviewRequest }) => reviewCommission(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all });
    },
  });
}
