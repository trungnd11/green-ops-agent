import { createRouter } from '@tanstack/react-router';
import { initAuthService } from '@xanh/auth';
import { queryClient } from '../query/query-client';
import { routeTree } from '../../routeTree.gen';
import { env } from '../config/env';
import { createDriverAuthStore } from '../auth/driver-auth-store';
import type { RouterContext } from '../../routes/__root';

initAuthService(env.PUBLIC_API_BASE_URL);

export const authStore = createDriverAuthStore(env.PUBLIC_API_BASE_URL);
const session = authStore.getSession();

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      isAuthenticated: session !== null,
      fullName: session?.fullName ?? null,
    },
  } as RouterContext,
  defaultPreload: 'intent',
});
