import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../../constants/query/user";
import { createUser } from "../../api/user.api";

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
