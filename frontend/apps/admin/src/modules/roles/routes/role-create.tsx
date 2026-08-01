import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RoleCreatePage } from "../pages/role-create-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/roles/create",
  component: RoleCreatePage,
});
