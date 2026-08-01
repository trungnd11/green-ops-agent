import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RoleDetailPage } from "../pages/role-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/roles/$roleId",
  component: RoleDetailPage,
});
