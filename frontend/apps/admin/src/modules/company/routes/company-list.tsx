import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { CompanyListPage } from "../pages/company-list-page";
import { companySearchSchema } from "../schemas/company-search.schema";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/companies",
  component: CompanyListPage,
  validateSearch: (search: Record<string, unknown>) => companySearchSchema.parse(search),
});
