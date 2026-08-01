import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { UserEditPage } from "../pages/user-edit-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/users/$userId/edit",
  component: UserEditPage,
});
