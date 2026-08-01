import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { AdminPage } from "@/modules/admin";
import { userSearchSchema } from "../schemas/user-search.schema";
import { ADMIN_ROUTES } from "../constants";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: ADMIN_ROUTES.LIST,
  component: AdminPage,
  validateSearch: (search: Record<string, unknown>) => userSearchSchema.parse(search),
});
