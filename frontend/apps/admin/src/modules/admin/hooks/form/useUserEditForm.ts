import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "@xanh/ui/notification";
import { fetchUser, updateUser } from "../../api/user.api";
import { ADMIN_ROUTES } from "../../constants";

export function useUserEditForm() {
  const { userId } = useParams({ from: "/_authenticated/admin/users/$userId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const vals = useRef({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    status: "active",
  });
  const [, setRenderTick] = useState(0);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 0,
  });

  useEffect(() => {
    if (user) {
      vals.current = {
        username: user.username,
        fullName: user.fullName,
        email: user.email || "",
        phone: user.phone || "",
        status: user.status,
      };
      setRenderTick((t) => t + 1);
    }
  }, [user]);

  const v = (name: string) => vals.current[name as keyof typeof vals.current] ?? "";
  const sv = (name: string, val: string) => {
    vals.current[name as keyof typeof vals.current] = val;
    setErrors({});
    setRenderTick((t) => t + 1);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vals.current.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (vals.current.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.current.email))
      errs.email = "Email không hợp lệ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        fullName: vals.current.fullName,
        status: vals.current.status,
      };
      if (vals.current.email) payload.email = vals.current.email;
      if (vals.current.phone) payload.phone = vals.current.phone;
      await updateUser(userId, payload);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      navigate({
        to: ADMIN_ROUTES.LIST,
        search: { page: 0, keyword: "", status: "" } as any,
      });
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description: err instanceof Error ? err.message : "Cập nhật thất bại",
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    userId,
    user,
    isLoading,
    error,
    tab,
    setTab,
    saving,
    errors,
    v,
    sv,
    handleSubmit,
  };
}
