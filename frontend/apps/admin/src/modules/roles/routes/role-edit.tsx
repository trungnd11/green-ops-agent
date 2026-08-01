import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RoleEditPage } from "../pages/role-edit-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/roles/$roleId/edit",
  component: RoleEditPage,
});
