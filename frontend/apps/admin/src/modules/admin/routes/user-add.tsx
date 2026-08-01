import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { UserAddPage } from "../pages/user-add-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/users/add",
  component: UserAddPage,
});
