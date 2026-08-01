import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RevenueImportPage } from "../pages/revenue-import-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/revenues/import",
  component: RevenueImportPage,
});
