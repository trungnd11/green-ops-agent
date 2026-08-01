import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { DriverAddPage } from "../pages/driver-add-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/drivers/add",
  component: DriverAddPage,
});
