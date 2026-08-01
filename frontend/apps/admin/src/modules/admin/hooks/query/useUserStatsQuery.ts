import { useQuery } from "@tanstack/react-query";
import { userKeys } from "../../constants/query/user";
import { fetchUserStats } from "../../api/user.api";

export function useUserStatsQuery() {
  return useQuery<Record<string, number>>({
    queryKey: userKeys.stats(),
    queryFn: fetchUserStats as () => Promise<Record<string, number>>,
    staleTime: 30_000,
    retry: false,
  });
}
