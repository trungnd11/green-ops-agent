import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { ReportsPage } from "../pages/reports-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/reports",
  component: ReportsPage,
});
