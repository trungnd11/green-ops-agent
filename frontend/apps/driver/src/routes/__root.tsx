import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
  auth: {
    isAuthenticated: boolean;
    fullName: string | null;
  };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
    </>
  ),
});
