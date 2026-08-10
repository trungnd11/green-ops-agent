import { QueryClientProvider } from '@tanstack/react-query';
import { UIProvider } from '@xanh/ui';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../router';
import { queryClient } from '../query/query-client';
import { ToastProvider, WalletSheetsProvider } from '../../shared';

export function AppProviders() {
  return (
    <UIProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <WalletSheetsProvider>
            <RouterProvider router={router} />
          </WalletSheetsProvider>
        </QueryClientProvider>
      </ToastProvider>
    </UIProvider>
  );
}
