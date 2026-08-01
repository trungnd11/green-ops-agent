import { z } from "zod";

export const createRoleSchema = z.object({
  code: z
    .string()
    .min(2, "Mã vai trò phải có ít nhất 2 ký tự")
    .max(50, "Mã vai trò tối đa 50 ký tự")
    .regex(/^[A-Z_]+$/, "Mã vai trò chỉ gồm chữ in hoa và gạch dưới"),
  name: z.string().min(1, "Tên vai trò không được để trống").max(255, "Tên vai trò tối đa 255 ký tự"),
  description: z.string().max(500, "Mô tả tối đa 500 ký tự").optional(),
  permissionIds: z.array(z.string()).min(1, "Chọn ít nhất một quyền"),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống").max(255, "Tên vai trò tối đa 255 ký tự"),
  description: z.string().max(500, "Mô tả tối đa 500 ký tự").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  permissionIds: z.array(z.string()).min(1, "Chọn ít nhất một quyền"),
});

export type CreateRoleForm = z.infer<typeof createRoleSchema>;
export type UpdateRoleForm = z.infer<typeof updateRoleSchema>;
