import { createRoute } from '@tanstack/react-router';
import { Route as authRoute } from '../../../routes/_auth';
import { NotificationPage } from '../pages/notification-page';

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/notifications',
  component: NotificationPage,
});
