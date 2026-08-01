import { createHttpClient } from "@xanh/api-client";
import { authSessionService } from "@/modules/auth";

export const httpClient = createHttpClient({
  baseUrl: "/api/v1",
  timeout: 15_000,
  getAccessToken: () => authSessionService.getAccessToken(),
  getCompanyId: () => authSessionService.getCompanyId(),
  onUnauthorized: () => {
    authSessionService.clear();
    window.location.href = "/login";
  },
});
