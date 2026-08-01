import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { DriverListPage } from "../pages/driver-list-page";
import { driverSearchSchema } from "../schemas/driver-search.schema";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/drivers",
  validateSearch: (search: Record<string, unknown>) => driverSearchSchema.parse(search),
  component: DriverListPage,
});
