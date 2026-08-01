import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Search, Check, Square, X, Save } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { FormField } from "../../../shared/components/FormField";
import type { CreateRoleForm } from "../forms/role-form.schema";
import { createRole } from "../api/role.api";
import { permissionQueries, roleQueries } from "../api/role.queries";
import type { PermissionTreeResponse } from "../api/role.api";

export function RoleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: permTree } = useQuery(permissionQueries.tree());
  const [permSearch, setPermSearch] = useState("");

  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: roleQueries.all() });
      navigate({ to: `/admin/roles/${role.id}` });
    },
  });

  const form = useForm({
    defaultValues: {
      code: "" as string,
      name: "" as string,
      description: "" as string,
      permissionIds: [] as string[],
    },
    validators: {
      onChange: ({ value }: { value: CreateRoleForm }) => {
        const fields: Record<string, string> = {};
        if (!value.name) fields.name = "Tên vai trò không được để trống";
        if (!value.code) fields.code = "Mã vai trò không được để trống";
        else if (!/^[A-Z_]+$/.test(value.code)) fields.code = "Mã vai trò chỉ gồm chữ in hoa và gạch dưới";
        if (value.permissionIds.length === 0) fields.permissionIds = "Chọn ít nhất một quyền";
        return Object.keys(fields).length > 0 ? { fields } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const { description, ...rest } = value;
      await mutation.mutateAsync(description ? { ...rest, description } : rest);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Tạo vai trò
          </h1>
          <p className="text-text-secondary text-[13px]">Tạo vai trò mới và thiết lập các quyền hạn.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate({ to: "/admin/roles", search: { page: 0, keyword: "" } } as any)}>
            <X className="h-4 w-4" /> Hủy
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button
                onClick={() => form.handleSubmit()}
                isLoading={isSubmitting}
                leftIcon={isSubmitting ? undefined : <Save className="h-4 w-4" />}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu vai trò"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex w-[480px] shrink-0 flex-col gap-4">
          <div
            className="rounded-card flex flex-col gap-4 border p-5"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
          >
            <h2 className="text-text-primary text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Thông tin vai trò
            </h2>

            <form.Field name="name">
              {(field) => (
                <FormField label="Tên vai trò" required error={field.state.meta.errors as any}>

                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="VD: Quản lý tài xế"
                    className="!h-12"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="code">
              {(field) => (
                <FormField label="Mã vai trò" required error={field.state.meta.errors as any}>

                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                    placeholder="VD: DRIVER_MANAGER"
                    className="!h-12"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-[13px] font-medium">Mô tả</label>
                  <textarea
                    className="rounded-btn text-text-primary placeholder:text-text-tertiary w-full resize-none border px-3.5 py-2.5 text-[13px] outline-none"
                    style={{ height: "80px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
                    placeholder="Mô tả ngắn về vai trò này..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <div
          className="rounded-card flex flex-1 flex-col gap-3 border p-5"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Quyền hạn
            </h2>
            <form.Subscribe selector={(s) => s.values.permissionIds}>
              {(permIds) => <span className="text-text-tertiary text-[12px]">{permIds.length} quyền được chọn</span>}
            </form.Subscribe>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="rounded-btn flex items-center gap-2 border px-3.5"
              style={{ height: "36px", width: "320px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
            >
              <Search className="text-text-tertiary h-3.5 w-3.5 shrink-0" />
              <input
                className="text-text-primary placeholder:text-text-tertiary flex-1 bg-transparent text-[12px] outline-none"
                placeholder="Tìm kiếm quyền..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
              />
            </div>
            <form.Subscribe selector={(s) => s.values.permissionIds}>
              {(permIds) => {
                const allIds = getAllPermIds(permTree);
                const allSelected = allIds.length > 0 && allIds.every((id) => permIds.includes(id));
                return (
                  <button
                    className="text-brand-cyan text-[12px] hover:underline"
                    onClick={() => form.setFieldValue("permissionIds", allSelected ? [] : allIds)}
                  >
                    {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                );
              }}
            </form.Subscribe>
          </div>

          <form.Subscribe selector={(s) => s.values.permissionIds}>
            {(permIds) => (
              <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "500px" }}>
                  {filterPermTree(permTree, permSearch).map((group) => {
                    const groupPermIds = [...group.permissions.map((p) => p.id), ...(group.children ?? []).flatMap((c) => c.permissions.map((p) => p.id))];
                    const allGroupSelected = groupPermIds.length > 0 && groupPermIds.every((id) => permIds.includes(id));
                    return (
                  <div key={group.moduleId}>
                    <div
                      className="flex items-center gap-2 border-b py-2 cursor-pointer select-none"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                      onClick={() => form.setFieldValue("permissionIds", allGroupSelected ? permIds.filter((id: string) => !groupPermIds.includes(id)) : [...permIds, ...groupPermIds.filter((id: string) => !permIds.includes(id))])}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded shrink-0" style={{ background: allGroupSelected ? "#00C7A5" : "transparent", border: allGroupSelected ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                        {allGroupSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-text-primary text-[13px] font-medium">{group.moduleName}</span>
                      <span className="text-text-tertiary text-[11px]">({group.permissions.length} quyền)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 py-1.5 pl-4">
                      {group.permissions.map((perm) => {
                        const selected = permIds.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] transition-colors"
                            style={{
                              background: selected ? "rgba(0,199,165,0.14)" : "#101B2B",
                              color: selected ? "#00C7A5" : "#8792A2",
                            }}
                            onClick={() =>
                              form.setFieldValue(
                                "permissionIds",
                                selected ? permIds.filter((id: string) => id !== perm.id) : [...permIds, perm.id]
                              )
                            }
                          >
                            {selected && <Check className="h-3 w-3" />}
                            {perm.name}
                          </button>
                        );
                      })}
                    </div>
                    {(group.children ?? []).map((child) => {
                      const childPermIds = child.permissions.map((p) => p.id);
                      const allChildSelected = childPermIds.length > 0 && childPermIds.every((id) => permIds.includes(id));
                      return (
                      <div key={child.moduleId} className="pl-6">
                        <div className="flex items-center gap-2 py-2 cursor-pointer select-none" onClick={() => form.setFieldValue("permissionIds", allChildSelected ? permIds.filter((id: string) => !childPermIds.includes(id)) : [...permIds, ...childPermIds.filter((id: string) => !permIds.includes(id))])}>
                          <div className="flex items-center justify-center w-4 h-4 rounded shrink-0" style={{ background: allChildSelected ? "#00C7A5" : "transparent", border: allChildSelected ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                            {allChildSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="text-text-primary text-[12px] font-medium">{child.moduleName}</span>
                          <span className="text-text-tertiary text-[11px]">({child.permissions.length} quyền)</span>
                        </div>
                        <div className="flex flex-wrap gap-2 py-1.5">
                          {child.permissions.map((perm) => {
                            const selected = permIds.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] transition-colors"
                                style={{
                                  background: selected ? "rgba(0,199,165,0.14)" : "#101B2B",
                                  color: selected ? "#00C7A5" : "#8792A2",
                                }}
                                onClick={() =>
                                  form.setFieldValue(
                                    "permissionIds",
                                    selected ? permIds.filter((id: string) => id !== perm.id) : [...permIds, perm.id]
                                  )
                                }
                              >
                                {selected && <Check className="h-3 w-3" />}
                                {perm.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  );
                })}
              </div>
            )}
          </form.Subscribe>
        </div>
      </div>

      <form.Subscribe selector={(s) => s.errors}>
        {(errors) =>
          errors.length > 0 ? (
            <div
              className="text-semantic-error rounded-btn p-3 text-[13px]"
              style={{ background: "rgba(240,82,82,0.1)" }}
            >
              Vui lòng kiểm tra lại các trường bắt buộc
            </div>
          ) : null
        }
      </form.Subscribe>
    </div>
  );
}

function getAllPermIds(tree?: PermissionTreeResponse[]): string[] {
  if (!tree) return [];
  return tree.flatMap((g) => [
    ...g.permissions.map((p) => p.id),
    ...(g.children ?? []).flatMap((c) => c.permissions.map((p) => p.id)),
  ]);
}

function filterPermTree(tree: PermissionTreeResponse[] | undefined, search: string): PermissionTreeResponse[] {
  if (!tree) return [];
  if (!search) return tree;
  const q = search.toLowerCase();
  return tree
    .map((g) => ({
      ...g,
      permissions: g.permissions.filter((p) => p.name.toLowerCase().includes(q)),
      children: (g.children ?? [])
        .map((c) => ({
          ...c,
          permissions: c.permissions.filter((p) => p.name.toLowerCase().includes(q)),
        }))
        .filter((c) => c.permissions.length > 0),
    }))
    .filter((g) => g.permissions.length > 0 || (g.children?.length ?? 0) > 0);
}
