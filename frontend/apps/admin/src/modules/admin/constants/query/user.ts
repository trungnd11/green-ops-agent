export const userKeys = {
  all: ["users"] as const,
  list: (params: Record<string, unknown> = {}) => [...userKeys.all, "list", params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  stats: () => [...userKeys.all, "stats"] as const,
  companies: (id: string) => [...userKeys.all, "companies", id] as const,
  count: () => [...userKeys.all, "count"] as const,
};
