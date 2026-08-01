export const DRIVER_ROUTES = {
  LIST: '/drivers' as const,
  DETAIL: (id: string) => `/drivers/${id}` as const,
} as const;
