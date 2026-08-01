import { useQuery } from "@tanstack/react-query";
import { authKeys } from "../api/auth.keys";
import { authSessionService } from "../services/auth-session.service";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authSessionService.getSession(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
