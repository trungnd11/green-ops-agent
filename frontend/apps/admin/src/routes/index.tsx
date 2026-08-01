import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
  loader: () => {
    throw redirect({ to: "/login" });
  },
});
