import { createRouter } from "@tanstack/react-router";
import { createAuthStore } from "@xanh/auth";
import { queryClient } from "../query/query-client";
import { routeTree } from "../../routeTree.gen";
import { env } from "../config/env";
import type { RouterContext } from "../../routes/__root";

export const authStore = createAuthStore(env.PUBLIC_API_BASE_URL);
const session = authStore.getSession();

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      isAuthenticated: session !== null,
      fullName: session?.fullName ?? null,
      role: session?.role ?? null,
      companyName: session?.companyName ?? null,
    },
  } as RouterContext,
  defaultPreload: "intent",
});
