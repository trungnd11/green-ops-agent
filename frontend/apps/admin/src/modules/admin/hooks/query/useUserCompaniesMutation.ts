import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "@xanh/ui/notification";
import { userKeys } from "../../constants/query/user";
import { addUserToCompany, removeUserFromCompany } from "../../api/user.api";

export function useAddCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, companyId }: { userId: string; companyId: string }) => addUserToCompany(userId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.companies("") });
    },
  });
}

export function useRemoveCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, companyId }: { userId: string; companyId: string }) =>
      removeUserFromCompany(userId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.companies("") });
    },
    onError: (err: Error) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
  });
}
