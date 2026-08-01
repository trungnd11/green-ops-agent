import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { CompanyDetailPage } from "../pages/company-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/companies/$companyId",
  component: CompanyDetailPage,
});
