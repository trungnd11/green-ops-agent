import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { DriverDetailPage } from "../pages/driver-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/drivers/$driverId",
  component: DriverDetailPage,
});
