import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "../api/auth.keys";
import { useAuth } from "../stores/auth-store";

export function useLogoutMutation() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logout();
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.clear();
    },
  });
}
