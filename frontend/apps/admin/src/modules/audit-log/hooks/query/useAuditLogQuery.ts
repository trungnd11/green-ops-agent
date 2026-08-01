import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "../../api/audit-log.api";

export function useAuditLogQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ["audit-logs", "list", params],
    queryFn: () => fetchAuditLogs(params as any),
    retry: false,
  });
}
