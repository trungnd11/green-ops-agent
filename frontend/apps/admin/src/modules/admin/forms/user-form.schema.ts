import { z } from "zod";

const phoneSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .refine((v) => /^(0|\+84)\d{9}$/.test(v.replace(/[\s.-]/g, "")), "Số điện thoại không hợp lệ (VD: 0912345678)"),
  ])
  .optional();

export const addUserSchema = z
  .object({
    firstName: z.string().min(1, "Vui lòng nhập họ"),
    lastName: z.string().min(1, "Vui lòng nhập tên"),
    email: z.string().email("Email không hợp lệ").or(z.literal("")),
    phone: phoneSchema,
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    company: z.string().optional(),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
    status: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const editUserSchema = z.object({
  username: z.string().optional(),
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ").or(z.literal("")),
  phone: phoneSchema,
  status: z.string().min(1),
});
