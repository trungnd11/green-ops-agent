import { createRoute } from '@tanstack/react-router';
import { Route as authRoute } from '../../../routes/_auth';
import { ProfilePage } from '../pages/profile-page';

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/profile',
  component: ProfilePage,
});
