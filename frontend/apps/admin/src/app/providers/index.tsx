import { QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "@xanh/ui";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "../../modules/auth";
import { router } from "../router";
import { queryClient } from "../query/query-client";

export function AppProviders() {
  return (
    <UIProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </UIProvider>
  );
}
