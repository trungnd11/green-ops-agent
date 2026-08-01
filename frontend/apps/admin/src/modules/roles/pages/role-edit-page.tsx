import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Search, Check, AlertTriangle, X, Save } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { FormField } from "../../../shared/components/FormField";
import type { UpdateRoleForm } from "../forms/role-form.schema";
import { updateRole, replaceRolePermissions } from "../api/role.api";
import { roleQueries, permissionQueries } from "../api/role.queries";
import type { PermissionTreeResponse } from "../api/role.api";

export function RoleEditPage() {
  const { roleId } = useParams({ from: "/_authenticated/admin/roles/$roleId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [permSearch, setPermSearch] = useState("");

  const { data: role, isLoading } = useQuery(roleQueries.detail(roleId));
  const { data: permTree } = useQuery(permissionQueries.tree());

  const mutation = useMutation({
    mutationFn: async (data: UpdateRoleForm) => {
      const { description, ...rest } = data;
      await updateRole(roleId, { ...rest, ...(description ? { description } : {}) });
      await replaceRolePermissions(roleId, data.permissionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueries.all() });
      queryClient.invalidateQueries({ queryKey: [...roleQueries.all(), "detail", roleId] });
      navigate({ to: `/admin/roles/${roleId}` });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "" as string,
      description: "" as string,
      status: "ACTIVE" as "ACTIVE" | "INACTIVE",
      permissionIds: [] as string[],
    },
    validators: {
      onChange: ({ value }: { value: UpdateRoleForm }) => {
        const fields: Record<string, string> = {};
        if (!value.name) fields.name = "Tên vai trò không được để trống";
        if (value.permissionIds.length === 0) fields.permissionIds = "Chọn ít nhất một quyền";
        return Object.keys(fields).length > 0 ? { fields } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const { description, ...rest } = value;
      await mutation.mutateAsync(description ? { ...rest, description } : rest);
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
        status: role.status,
        permissionIds: role.permissions?.map((p) => p.id) ?? [],
      });
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 rounded" style={{ background: "#3A4352" }} />
            <div className="mt-1 h-4 w-64 rounded" style={{ background: "#3A4352" }} />
          </div>
          <div className="flex gap-3">
            <div className="rounded-btn h-11 w-20" style={{ background: "#3A4352" }} />
            <div className="rounded-btn h-11 w-28" style={{ background: "#3A4352" }} />
          </div>
        </div>
        <div className="rounded-card flex-1 border" style={{ height: 500, borderColor: "rgba(255,255,255,0.12)" }} />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20">
        <span className="text-text-primary text-[16px] font-semibold">Không tìm thấy vai trò</span>
        <button
          className="text-brand-cyan text-[13px] hover:underline"
          onClick={() => navigate({ to: "/admin/roles", search: { page: 0, keyword: "" } } as any)}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Chỉnh sửa vai trò
          </h1>
          <p className="text-text-secondary text-[13px]">Cập nhật thông tin và quyền hạn của vai trò {role.name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate({ to: `/admin/roles/${roleId}` } as any)}>
            <X className="h-4 w-4" /> Hủy
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button onClick={() => form.handleSubmit()} isLoading={isSubmitting} leftIcon={isSubmitting ? undefined : <Save className="h-4 w-4" />}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <div className="rounded-btn flex items-start gap-3 p-4" style={{ background: "rgba(245,158,11,0.1)" }}>
        <AlertTriangle className="text-semantic-warning mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-text-primary text-[13px] leading-relaxed">
          Vai trò này đang được gán cho người dùng. Thay đổi quyền hạn có thể ảnh hưởng đến quyền truy cập của họ.
        </p>
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
                    className="!h-12"
                  />
                </FormField>
              )}
            </form.Field>

            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-text-secondary text-[13px] font-medium">Mã vai trò</label>
                <div
                  className="rounded-btn flex items-center border px-3.5"
                  style={{ height: "48px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
                >
                  <span className="text-text-tertiary flex-1 text-[13px]">{role.code}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[11px]"
                    style={{ background: "#3A4352", color: "#667180" }}
                  >
                    Không thể sửa
                  </span>
                </div>
              </div>
              <form.Field name="status">
                {(field) => (
                  <div className="flex flex-col gap-1.5" style={{ width: "160px" }}>
                    <label className="text-text-secondary text-[13px] font-medium">Trạng thái</label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as "ACTIVE" | "INACTIVE")}
                      options={[
                        { value: "ACTIVE", label: "Đang hoạt động" },
                        { value: "INACTIVE", label: "Vô hiệu hóa" },
                      ]}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-[13px] font-medium">Mô tả</label>
                  <textarea
                    className="rounded-btn text-text-primary w-full resize-none border px-3.5 py-2.5 text-[13px] outline-none"
                    style={{ height: "80px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-tertiary">Ngày tạo</span>
                <span className="text-text-primary">{new Date(role.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
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

          <div className="flex items-center gap-2">
            <div
              className="rounded-btn flex items-center gap-2 border px-3"
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
    </div>
  );
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
