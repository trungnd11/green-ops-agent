import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RevenueDriverDetailPage } from "../pages/revenue-driver-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/revenues/$periodId/drivers/$driverId",
  component: RevenueDriverDetailPage,
});
