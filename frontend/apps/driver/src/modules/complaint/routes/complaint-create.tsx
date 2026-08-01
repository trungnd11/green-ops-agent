import { createRoute } from "@tanstack/react-router";
import { Route as authRoute } from "../../../routes/_auth";
import { ComplaintCreatePage } from "../pages/complaint-create-page";

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: "/complaints/create",
  component: ComplaintCreatePage,
});
