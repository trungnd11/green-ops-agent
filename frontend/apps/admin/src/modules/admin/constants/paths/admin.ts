export const ADMIN_ROUTES = {
  LIST: '/admin' as const,
  ADD: '/admin/users/add' as const,
  DETAIL: (id: string) => `/admin/users/${id}` as const,
  EDIT: (id: string) => `/admin/users/${id}/edit` as const,
} as const;

export const COMPANY_ROUTES = {
  LIST: '/admin/companies' as const,
  DETAIL: (id: string) => `/admin/companies/${id}` as const,
  ADD: '/admin/companies/add' as const,
  EDIT: (id: string) => `/admin/companies/${id}/edit` as const,
} as const;
