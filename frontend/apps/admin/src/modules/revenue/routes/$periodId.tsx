import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RevenueDetailPage } from "../pages/revenue-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/revenues/$periodId",
  component: RevenueDetailPage,
});
