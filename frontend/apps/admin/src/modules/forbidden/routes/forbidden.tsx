import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { ForbiddenPage } from "../pages/forbidden-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/403",
  component: ForbiddenPage,
});
