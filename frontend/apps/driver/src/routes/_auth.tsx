import { createRoute, redirect, Outlet } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { DriverLayout } from '../layouts/driver-layout';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  component: () => (
    <DriverLayout>
      <Outlet />
    </DriverLayout>
  ),
  beforeLoad: ({ context, location }) => {
    if (!context.auth?.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
});
