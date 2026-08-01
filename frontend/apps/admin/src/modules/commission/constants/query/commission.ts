export const commissionKeys = {
  all: ["commissions"] as const,
  list: (params: Record<string, unknown> = {}) => [...commissionKeys.all, "list", params] as const,
};
