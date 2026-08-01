import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "@xanh/ui/notification";
import { userKeys } from "../../constants/query/user";
import { deleteUser } from "../../api/user.api";

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      notification.success({ message: "Xóa người dùng thành công", placement: "bottomRight" });
    },
    onError: (err: Error) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
  });
}
