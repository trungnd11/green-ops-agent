import { useQuery } from "@tanstack/react-query";
import { driverQueries } from "@/modules/drivers/api/driver.queries";

export function useDriverListQuery(page: number, pageSize: number, keyword: string, statusFilter: string) {
  const queryParams: Record<string, unknown> = { page, size: pageSize };
  if (keyword) queryParams.search = keyword;
  if (statusFilter && statusFilter !== "all") queryParams.status = statusFilter;

  return useQuery(driverQueries.list(queryParams));
}

export function useDriverStatsQuery() {
  return useQuery(driverQueries.stats());
}
