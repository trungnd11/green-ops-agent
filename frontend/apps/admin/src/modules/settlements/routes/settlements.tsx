import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { SettlementsPage } from "../pages/settlements-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settlements",
  component: SettlementsPage,
});
