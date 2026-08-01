import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../api/auth.api";
import { authKeys } from "../api/auth.keys";
import { useAuth } from "../stores/auth-store";
import type { LoginRequest } from "../api/auth.types";

export function useLoginMutation() {
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginApi(payload),
    onSuccess: (data) => {
      setUser(data as import("../api/auth.types").AuthUser);
    },
  });
}
