import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchComplaints, fetchComplaint, fetchComplaintStats, respondComplaint } from "./complaint.api";

export const complaintKeys = {
  all: ["complaints"] as const,
  list: (status: string, page: number) => [...complaintKeys.all, "list", status, page] as const,
  detail: (id: string) => [...complaintKeys.all, "detail", id] as const,
  stats: () => [...complaintKeys.all, "stats"] as const,
};

export function useComplaintList(status = "all", page = 0) {
  return useQuery({
    queryKey: complaintKeys.list(status, page),
    queryFn: () => fetchComplaints(status, page),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: () => fetchComplaint(id),
  });
}

export function useComplaintStats() {
  return useQuery({
    queryKey: complaintKeys.stats(),
    queryFn: fetchComplaintStats,
  });
}

export function useRespondComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, response }: { id: string; action: string; response?: string }) =>
      respondComplaint(id, action, response),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}
