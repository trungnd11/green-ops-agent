import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { TasksPage } from "../pages/tasks-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/tasks",
  component: TasksPage,
});
