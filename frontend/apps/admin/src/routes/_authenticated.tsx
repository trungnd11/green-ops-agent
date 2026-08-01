import { createRoute, redirect, Outlet } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { AdminLayout } from "../layouts/admin-layout";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
  beforeLoad: ({ context, location }) => {
    const auth = context.auth;
    if (!auth?.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
});
