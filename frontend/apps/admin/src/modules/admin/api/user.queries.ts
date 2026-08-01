import { queryOptions } from "@tanstack/react-query";
import { userKeys } from "../constants/query/user";
import { fetchUsers, fetchUser, fetchUserStats } from "./user.api";
import type { UserSearchParams } from "./user.types";

export const userQueries = {
  list: (params: UserSearchParams = {}) =>
    queryOptions({
      queryKey: userKeys.list(params as Record<string, unknown>),
      queryFn: () => fetchUsers(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: userKeys.detail(id),
      queryFn: () => fetchUser(id),
    }),
  stats: () =>
    queryOptions({
      queryKey: userKeys.stats(),
      queryFn: fetchUserStats,
      staleTime: 30_000,
    }),
};
