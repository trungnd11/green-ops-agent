import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { ComplaintDetailPage } from "../pages/complaint-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/complaints/$id",
  component: ComplaintDetailPage,
});
