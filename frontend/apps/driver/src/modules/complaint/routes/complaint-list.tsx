import { createRoute } from "@tanstack/react-router";
import { Route as authRoute } from "../../../routes/_auth";
import { ComplaintListPage } from "../pages/complaint-list-page";

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: "/complaints",
  component: ComplaintListPage,
});
