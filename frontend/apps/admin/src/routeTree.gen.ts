import { rootRoute } from "./routes/__root";
import { Route as LoginRoute } from "./modules/authentication/routes/login";
import { Route as AuthenticatedRoute } from "./routes/_authenticated";
import { Route as AuthenticatedIndexRoute } from "./modules/dashboard/routes/index";
import { Route as AuthenticatedTasksRoute } from "./modules/tasks/routes/tasks";
import { Route as AuthenticatedSettlementsRoute } from "./modules/settlements/routes/settlements";
import { Route as AuthenticatedSettlementsIdRoute } from "./modules/settlements/routes/settlement-detail";
import { Route as AuthenticatedDriversIndexRoute } from "./modules/drivers/routes/index";
import { Route as AuthenticatedDriversDriverIdRoute } from "./modules/drivers/routes/$driverId";
import { Route as AuthenticatedDriversAddRoute } from "./modules/drivers/routes/driver-add";
import { Route as AuthenticatedDriversDriverIdEditRoute } from "./modules/drivers/routes/driver-edit";
import { Route as AuthenticatedRevenuesIndexRoute } from "./modules/revenue/routes/index";
import { Route as AuthenticatedRevenuesImportRoute } from "./modules/revenue/routes/revenue-import";
import { Route as AuthenticatedRevenuesPeriodIdRoute } from "./modules/revenue/routes/$periodId";
import { Route as AuthenticatedRevenuesPeriodIdDriverDriverIdRoute } from "./modules/revenue/routes/$periodId.driver-$driverId";
import { Route as AuthenticatedAdminRoute } from "./modules/admin/routes/admin";
import { Route as AuthenticatedAdminUsersAddRoute } from "./modules/admin/routes/user-add";
import { Route as AuthenticatedAdminUsersUserIdEditRoute } from "./modules/admin/routes/user-edit";
import { Route as AuthenticatedAdminUsersUserIdDetailRoute } from "./modules/admin/routes/user-detail";
import { Route as AuthenticatedComplaintsRoute } from "./modules/complaints/routes/complaints";
import { Route as AuthenticatedComplaintsIdRoute } from "./modules/complaints/routes/complaint-detail";
import { Route as AuthenticatedNotificationsRoute } from "./modules/notifications/routes/notifications";
import { Route as AuthenticatedReportsRoute } from "./modules/reports/routes/reports";
import { Route as AuthenticatedRequestsRoute } from "./modules/requests/routes/requests";
import { Route as AuthenticatedRoleListRoute } from "./modules/roles/routes/role-list";
import { Route as AuthenticatedRoleCreateRoute } from "./modules/roles/routes/role-create";
import { Route as AuthenticatedRoleDetailRoute } from "./modules/roles/routes/role-detail";
import { Route as AuthenticatedRoleEditRoute } from "./modules/roles/routes/role-edit";
import { Route as AuthenticatedCompanyListRoute } from "./modules/company/routes/company-list";
import { Route as AuthenticatedCompanyDetailRoute } from "./modules/company/routes/company-detail";
import { Route as AuthenticatedCompanyAddRoute } from "./modules/company/routes/company-add";
import { Route as AuthenticatedCompanyEditRoute } from "./modules/company/routes/company-edit";
import { Route as AuthenticatedAuditLogRoute } from "./modules/audit-log/routes/audit-log";
import { Route as AuthenticatedForbiddenRoute } from "./modules/forbidden/routes/forbidden";
import { Route as AuthenticatedPermissionRoute } from "./modules/permissions/routes/permission";
import { Route as AuthenticatedCommissionRoute } from "./modules/commission/routes/commission-review";
import { Route as AuthenticatedUserWalletRoute } from "./modules/user-wallet/routes/user-wallet";
import { Route as AuthenticatedUserWalletWithdrawalsRoute } from "./modules/user-wallet/routes/withdrawal-review";

const routeTree = rootRoute.addChildren([
  LoginRoute,
  AuthenticatedRoute.addChildren([
    AuthenticatedAdminRoute,
    AuthenticatedAdminUsersAddRoute,
    AuthenticatedAdminUsersUserIdDetailRoute,
    AuthenticatedAdminUsersUserIdEditRoute,
    AuthenticatedAuditLogRoute,
    AuthenticatedCompanyListRoute,
    AuthenticatedCompanyDetailRoute,
    AuthenticatedCompanyAddRoute,
    AuthenticatedCompanyEditRoute,
    AuthenticatedComplaintsRoute,
    AuthenticatedComplaintsIdRoute,
    AuthenticatedDriversAddRoute,
    AuthenticatedDriversDriverIdEditRoute,
    AuthenticatedDriversDriverIdRoute,
    AuthenticatedDriversIndexRoute,
    AuthenticatedForbiddenRoute,
    AuthenticatedIndexRoute,
    AuthenticatedNotificationsRoute,
    AuthenticatedPermissionRoute,
    AuthenticatedReportsRoute,
    AuthenticatedRequestsRoute,
    AuthenticatedRevenuesIndexRoute,
    AuthenticatedRevenuesImportRoute,
    AuthenticatedRevenuesPeriodIdRoute,
    AuthenticatedRevenuesPeriodIdDriverDriverIdRoute,
    AuthenticatedRoleCreateRoute,
    AuthenticatedRoleDetailRoute,
    AuthenticatedRoleEditRoute,
    AuthenticatedRoleListRoute,
    AuthenticatedCommissionRoute,
    AuthenticatedUserWalletRoute,
    AuthenticatedUserWalletWithdrawalsRoute,
    AuthenticatedSettlementsRoute,
    AuthenticatedSettlementsIdRoute,
    AuthenticatedTasksRoute,
  ]),
]);

export { routeTree };
