import { queryOptions } from "@tanstack/react-query";
import { driverKeys } from "../constants/query/driver";
import { fetchDrivers, fetchDriver, fetchDriverStats } from "./driver.api";
import type { DriverSearchParams } from "./driver.types";

export const driverQueries = {
  list: (params: DriverSearchParams = {}) =>
    queryOptions({
      queryKey: driverKeys.list(params as Record<string, unknown>),
      queryFn: () => fetchDrivers(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: driverKeys.detail(id),
      queryFn: () => fetchDriver(id),
    }),
  stats: () =>
    queryOptions({
      queryKey: driverKeys.stats(),
      queryFn: fetchDriverStats,
      staleTime: 30_000,
    }),
};
