import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { notification } from "@xanh/ui/notification";
import { addUserSchema } from "../../forms/user-form.schema";
import { createUser } from "../../api/user.api";
import { ADMIN_ROUTES } from "../../constants";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(): string {
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  return pwd;
}

export function useUserAddForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const generatedPwd = useRef("");
  const [tab, setTab] = useState(0);
  const [emailChanged, setEmailChanged] = useState(false);

  useEffect(() => {
    const pwd = generatePassword();
    generatedPwd.current = pwd;
    form.setFieldValue("password", pwd);
    form.setFieldValue("confirmPassword", pwd);
  }, []);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      username: "",
      company: "default",
      password: "",
      confirmPassword: "",
      status: "active",
    },
    validators: {
      onChange: ({ value }: { value: Record<string, string> }) => {
        const result = addUserSchema.safeParse({
          ...value,
          fullName: `${value.firstName} ${value.lastName}`.trim(),
        });
        if (!result.success) {
          const errs = result.error.flatten().fieldErrors;
          return {
            fields: Object.fromEntries(
              Object.entries(errs).map(([k, v]) => [k, v?.join(", ")]),
            ),
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }: { value: Record<string, string> }) => {
      try {
        const fullName = [value.firstName, value.lastName].filter(Boolean).join(" ").trim();
        const payload: Record<string, string | undefined> = {
          username: value.username,
          password: generatedPwd.current,
          fullName,
          status: value.status ?? "active",
        };
        if (value.email) payload.email = value.email;
        if (value.phone) payload.phone = value.phone;
        await createUser(payload as any);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        notification.success({
          message: "Tạo người dùng thành công",
          description: `Mật khẩu: ${generatedPwd.current}`,
          duration: 0,
          placement: "bottomRight",
        });
        navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any });
      } catch (err) {
        form.setErrorMap({
          onSubmit: err instanceof Error ? err.message : "Thêm người dùng thất bại",
        });
      }
    },
  });

  const handleEmailChange = (email: string) => {
    form.setFieldValue("email", email);
    if (!emailChanged && email.includes("@")) {
      setEmailChanged(true);
      form.setFieldValue("username", (email.split("@")[0] ?? "").toLowerCase());
    }
  };

  const serverError = String(form.useStore((s: any) => s.errorMap?.onSubmit) ?? "");

  return { form, tab, setTab, handleEmailChange, serverError, generatedPwd };
}
