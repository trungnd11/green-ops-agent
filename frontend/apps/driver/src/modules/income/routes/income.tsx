import { createRoute } from '@tanstack/react-router';
import { Route as authRoute } from '../../../routes/_auth';
import { IncomeListPage } from '../pages/income-list-page';

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/income',
  component: IncomeListPage,
});
