import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { NotificationsPage } from "../pages/notifications-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/notifications",
  component: NotificationsPage,
});
