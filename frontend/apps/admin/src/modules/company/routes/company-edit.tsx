import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { CompanyEditPage } from "../pages/company-edit-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/companies/$companyId/edit",
  component: CompanyEditPage,
});
