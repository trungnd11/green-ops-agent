import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../../constants/query/user";
import { updateUser } from "../../api/user.api";

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string | undefined> }) => updateUser(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
