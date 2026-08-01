export const driverKeys = {
  all: ["drivers"] as const,
  list: (params: Record<string, unknown> = {}) => [...driverKeys.all, "list", params] as const,
  detail: (id: string) => [...driverKeys.all, "detail", id] as const,
  stats: () => [...driverKeys.all, "stats"] as const,
};
