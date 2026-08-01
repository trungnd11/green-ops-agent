import { useQuery } from "@tanstack/react-query";
import { userQueries } from "@/modules/admin";

export function useUserListQuery(page: number, pageSize: number, keyword: string, statusFilter: string) {
  const queryParams: Record<string, unknown> = { page, size: pageSize };
  if (keyword) queryParams.keyword = keyword;
  if (statusFilter) queryParams.status = statusFilter;

  return useQuery(userQueries.list(queryParams));
}
