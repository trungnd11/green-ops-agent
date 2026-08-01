import { rootRoute } from './routes/__root';
import { Route as LoginRoute } from './modules/authentication/routes/login';
import { Route as AuthRoute } from './routes/_auth';
import { Route as AuthIndexRoute } from './modules/home/routes/index';
import { Route as AuthIncomeRoute } from './modules/income/routes/income';
import { Route as AuthNotificationsRoute } from './modules/notification/routes/notifications';
import { Route as AuthWalletRoute } from './modules/wallet/routes/wallet';
import { Route as AuthProfileRoute } from './modules/profile/routes/profile';
import { Route as AuthComplaintListRoute } from './modules/complaint/routes/complaint-list';
import { Route as AuthComplaintCreateRoute } from './modules/complaint/routes/complaint-create';
import { Route as AuthComplaintDetailRoute } from './modules/complaint/routes/complaint-detail';

const routeTree = rootRoute.addChildren([
  LoginRoute,
  AuthRoute.addChildren([
    AuthIndexRoute,
    AuthIncomeRoute,
    AuthNotificationsRoute,
    AuthWalletRoute,
    AuthProfileRoute,
    AuthComplaintListRoute,
    AuthComplaintCreateRoute,
    AuthComplaintDetailRoute,
  ]),
]);

export { routeTree };
