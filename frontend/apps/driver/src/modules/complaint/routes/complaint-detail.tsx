import { createRoute } from "@tanstack/react-router";
import { Route as authRoute } from "../../../routes/_auth";
import { ComplaintDetailPage } from "../pages/complaint-detail-page";

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: "/complaints/$id",
  component: ComplaintDetailPage,
});
