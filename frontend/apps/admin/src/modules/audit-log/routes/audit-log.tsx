import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { AuditLogPage } from "../pages/audit-log-page";
import { auditLogSearchSchema } from "../schemas/audit-log-search.schema";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/audit-log",
  component: AuditLogPage,
  validateSearch: (search: Record<string, unknown>) => auditLogSearchSchema.parse(search),
});
