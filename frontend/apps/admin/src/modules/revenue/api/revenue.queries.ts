import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchPeriods, fetchPeriod, fetchPeriodDetails, fetchDriverDetail } from "./revenue.api";
import type { RevenueSearchParams } from "./revenue.types";

export const revenueKeys = {
  all: ["revenue"] as const,
  periods: (params: RevenueSearchParams = {}) => [...revenueKeys.all, "periods", params] as const,
  period: (id: string) => [...revenueKeys.all, "period", id] as const,
  details: (periodId: string, params: RevenueSearchParams = {}) => [...revenueKeys.all, "details", periodId, params] as const,
  driverDetail: (periodId: string, detailId: string) => [...revenueKeys.all, "driver", periodId, detailId] as const,
};

export const revenueQueries = {
  periods: (params: RevenueSearchParams = {}) => queryOptions({
    queryKey: revenueKeys.periods(params),
    queryFn: () => fetchPeriods(params),
  }),
  period: (id: string) => queryOptions({
    queryKey: revenueKeys.period(id),
    queryFn: () => fetchPeriod(id),
  }),
  details: (periodId: string, params: RevenueSearchParams = {}) => queryOptions({
    queryKey: revenueKeys.details(periodId, params),
    queryFn: () => fetchPeriodDetails(periodId, params),
  }),
  driverDetail: (periodId: string, detailId: string) => queryOptions({
    queryKey: revenueKeys.driverDetail(periodId, detailId),
    queryFn: () => fetchDriverDetail(periodId, detailId),
  }),
};
