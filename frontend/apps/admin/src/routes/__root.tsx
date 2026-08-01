import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface RouterContext {
  queryClient: import("@tanstack/react-query").QueryClient;
  auth: {
    isAuthenticated: boolean;
    fullName: string | null;
    role: string | null;
    companyName: string | null;
  };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
    </>
  ),
});
