import { createRoute } from '@tanstack/react-router';
import { Route as authRoute } from '../../../routes/_auth';
import { HomePage } from '../pages/home-page';

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  component: HomePage,
});
