import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { PermissionPage } from "../pages/permission-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/permissions",
  component: PermissionPage,
});
