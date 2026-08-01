import { useQuery } from "@tanstack/react-query";
import { authKeys } from "../api/auth.keys";
import { fetch2FAStatusApi } from "../api/auth.api";

export function useTwoFAStatusQuery() {
  return useQuery({
    queryKey: authKeys.twoFAStatus(),
    queryFn: fetch2FAStatusApi,
    staleTime: 60_000,
    retry: false,
  });
}
