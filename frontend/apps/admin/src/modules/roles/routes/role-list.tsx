import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RoleListPage } from "../pages/role-list-page";
import { roleSearchSchema } from "../schemas/role-search.schema";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/roles",
  component: RoleListPage,
  validateSearch: (search: Record<string, unknown>) => roleSearchSchema.parse(search),
});
