import { QueryClientProvider } from '@tanstack/react-query';
import { UIProvider } from '@xanh/ui';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../router';
import { queryClient } from '../query/query-client';

export function AppProviders() {
  return (
    <UIProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </UIProvider>
  );
}
