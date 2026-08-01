import { queryOptions } from "@tanstack/react-query";
import { fetchRoles, fetchRole, fetchRoleUsers, fetchPermissionTree } from "./role.api";
import type { RoleResponse } from "./role.api";

export const roleQueries = {
  all: () => ["roles"] as const,
  list: (params: { page?: number; size?: number; keyword?: string; type?: string; status?: string } = {}) =>
    queryOptions({
      queryKey: [...roleQueries.all(), "list", params],
      queryFn: () => fetchRoles(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...roleQueries.all(), "detail", id],
      queryFn: () => fetchRole(id),
    }),
  users: (id: string, params: { page?: number; size?: number } = {}) =>
    queryOptions({
      queryKey: [...roleQueries.all(), "users", id, params],
      queryFn: () => fetchRoleUsers(id, params),
    }),
};

export const permissionQueries = {
  all: () => ["permissions"] as const,
  tree: () =>
    queryOptions({
      queryKey: [...permissionQueries.all(), "tree"],
      queryFn: fetchPermissionTree,
      staleTime: 5 * 60_000,
    }),
};
