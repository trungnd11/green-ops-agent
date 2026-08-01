import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { ComplaintsPage } from "../pages/complaints-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/complaints",
  component: ComplaintsPage,
});
