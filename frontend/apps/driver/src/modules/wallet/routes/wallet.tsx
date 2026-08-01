import { createRoute } from '@tanstack/react-router';
import { Route as authRoute } from '../../../routes/_auth';
import { WalletPage } from '../pages/wallet-page';

export const Route = createRoute({
  getParentRoute: () => authRoute,
  path: '/wallet',
  component: WalletPage,
});
