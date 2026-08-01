import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { DriverEditPage } from "../pages/driver-edit-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/drivers/$driverId/edit",
  component: DriverEditPage,
});
