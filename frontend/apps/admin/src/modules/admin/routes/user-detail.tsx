import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { UserDetailPage } from "../pages/user-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/users/$userId",
  component: UserDetailPage,
});
