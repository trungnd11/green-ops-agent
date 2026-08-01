import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RequestsPage } from "../pages/requests-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/requests",
  component: RequestsPage,
});
