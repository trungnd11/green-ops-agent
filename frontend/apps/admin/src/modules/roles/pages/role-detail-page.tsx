import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Clock,
  Copy,
  Edit3,
  X,
  Check,
  AlertTriangle,
  MoreHorizontal,
  ChevronRight,
  Search,
  Square,
  ArrowLeft,
  Save,
  Plus,
} from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Button } from "@xanh/ui/button";
import { roleQueries, permissionQueries } from "../api/role.queries";
import { replaceRolePermissions } from "../api/role.api";

type Tab = "overview" | "permissions" | "users" | "audit";

const statusLabel: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Vô hiệu hóa",
};

const statusColor: Record<string, string> = {
  ACTIVE: "#22C55E",
  INACTIVE: "#8792A2",
};

export function RoleDetailPage() {
  const { roleId } = useParams({ from: "/_authenticated/admin/roles/$roleId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: role, isLoading } = useQuery(roleQueries.detail(roleId));
  const { data: permTree } = useQuery(permissionQueries.tree());

  const permMutation = useMutation({
    mutationFn: (permissionIds: string[]) => replaceRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueries.all() });
      queryClient.invalidateQueries({ queryKey: [...roleQueries.all(), "detail", roleId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4">
        <div className="h-4 w-64 rounded" style={{ background: "#3A4352" }} />
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded" style={{ background: "#3A4352" }} />
          <div className="flex gap-3">
            <div className="rounded-btn h-11 w-24" style={{ background: "#3A4352" }} />
            <div className="rounded-btn h-11 w-28" style={{ background: "#3A4352" }} />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 rounded-full" style={{ background: "#3A4352" }} />
          ))}
        </div>
        <div
          className="rounded-card flex-1 border"
          style={{ height: 400, borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Shield className="text-text-disabled h-12 w-12" />
        <span className="text-text-primary text-[16px] font-semibold">Không tìm thấy vai trò</span>
        <button
          className="text-brand-cyan text-[13px] hover:underline flex items-center gap-1.5"
          onClick={() => navigate({ to: "/admin/roles", search: { page: 0, keyword: "" } } as any)}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "overview", label: "Tổng quan", icon: Shield },
    { key: "permissions", label: "Quyền hạn", icon: Check },
    { key: "users", label: "Người dùng", icon: Users },
    { key: "audit", label: "Nhật ký thay đổi", icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-text-tertiary flex items-center gap-1.5 text-[13px]">
        <span>Quản trị hệ thống</span>
        <ChevronRight className="h-3 w-3" />
        <span className="hover:text-text-secondary cursor-pointer" onClick={() => navigate({ to: "/admin/roles", search: { page: 0, keyword: "" } } as any)}>
          Vai trò
        </span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-text-primary">{role.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            {role.name}
          </h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 text-[11px] font-medium"
            style={{ height: "22px", background: "rgba(0,174,239,0.14)", color: "#00AEEF" }}
          >
            Vai trò hệ thống
          </span>
          <span className="text-[13px]" style={{ color: statusColor[role.status] }}>
            {statusLabel[role.status]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-btn flex items-center justify-center gap-1.5 border text-[13px] font-medium"
            style={{ height: "44px", padding: "0 20px", borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
            onClick={() => setShowCloneModal(true)}
          >
            <Copy className="h-4 w-4" />
            Nhân bản
          </button>
          <button
            className="rounded-btn bg-brand-teal flex items-center justify-center gap-1.5 text-[13px] font-medium text-white"
            style={{ height: "44px", padding: "0 20px" }}
            onClick={() => navigate({ to: `/admin/roles/${role.id}/edit` })}
          >
            <Edit3 className="h-4 w-4" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "#101B2B" }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
              style={{
                background: active ? "#1C2737" : "transparent",
                color: active ? "#F8FAFC" : "#8792A2",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="flex gap-4">
          <div
            className="rounded-card flex w-[400px] shrink-0 flex-col gap-3 border p-5"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
          >
            <h2 className="text-text-primary text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Thông tin vai trò
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { label: "Mã vai trò", value: role.code },
                { label: "Loại vai trò", value: "Hệ thống" },
                { label: "Trạng thái", value: statusLabel[role.status] },
                { label: "Số người dùng", value: "—" },
                { label: "Số quyền", value: String(role.permissions?.length ?? 0) },
                { label: "Ngày tạo", value: new Date(role.createdAt).toLocaleDateString("vi-VN") },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1">
                  <span className="text-text-tertiary text-[13px]">{row.label}</span>
                  <span className="text-text-primary text-[13px] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-card flex-1 border p-5"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
          >
            <h2 className="text-text-primary mb-3 text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Quyền hạn
            </h2>
            <p className="text-text-tertiary mb-4 text-[13px]">Vai trò này có {role.permissions?.length ?? 0} quyền.</p>
            <div className="flex flex-wrap gap-2">
              {(role.permissions ?? []).map((perm) => (
                <span
                  key={perm.id}
                  className="inline-flex items-center rounded-lg px-2.5 py-1 text-[12px]"
                  style={{ background: "#101B2B", color: "#8792A2" }}
                >
                  {perm.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div
          className="rounded-card border p-5"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Quyền hạn
            </h2>
            <button
              className="text-brand-cyan text-[12px] hover:underline flex items-center gap-1"
              onClick={() => {
                const allIds = getAllPermIds(permTree);
                permMutation.mutate(allIds);
              }}
            >
              <Save className="h-3.5 w-3.5" /> Lưu thay đổi
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(permTree ?? []).map((group) => (
              <div key={group.moduleId}>
                <div
                  className="flex items-center gap-2 border-b py-2"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <span className="text-text-primary text-[13px] font-medium">{group.moduleName}</span>
                </div>
                <div className="flex flex-wrap gap-2 py-1.5 pl-4">
                  {group.permissions.map((perm) => {
                    const selected = role.permissions?.some((p) => p.id === perm.id);
                    return (
                      <span
                        key={perm.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px]"
                        style={{
                          background: selected ? "rgba(0,199,165,0.14)" : "#101B2B",
                          color: selected ? "#00C7A5" : "#8792A2",
                        }}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {perm.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div
          className="rounded-card border p-5"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <h2 className="text-text-primary mb-4 text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
            Người dùng
          </h2>
          <p className="text-text-tertiary text-[13px]">Chưa có dữ liệu người dùng cho vai trò này.</p>
        </div>
      )}

      {activeTab === "audit" && (
        <div
          className="rounded-card border p-5"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <h2 className="text-text-primary mb-4 text-[16px] font-semibold" style={{ fontFamily: "Manrope" }}>
            Nhật ký thay đổi
          </h2>
          <p className="text-text-tertiary text-[13px]">Chưa có nhật ký thay đổi.</p>
        </div>
      )}

      {showCloneModal && <CloneModal role={role} onClose={() => setShowCloneModal(false)} />}
      {showDeleteModal && <DeleteBlockedModal role={role} onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}

function CloneModal({
  role,
  onClose,
}: {
  role: { name: string; code: string; description: string };
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(`${role.name} (sao chép)`);
  const [code, setCode] = useState(`${role.code}_COPY`);
  const [description, setDescription] = useState(role.description || "");
  const [copyPerms, setCopyPerms] = useState(true);

  const mutation = useMutation({
    mutationFn: (data: { code: string; name: string; description?: string; permissionIds: string[] }) =>
      import("../api/role.api").then((m) => m.createRole(data)),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      navigate({ to: `/admin/roles/${newRole.id}` });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="rounded-card w-[480px] border"
        style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pb-0 pt-6">
          <h3 className="text-text-primary text-[18px] font-semibold" style={{ fontFamily: "Manrope" }}>
            Nhân bản vai trò
          </h3>
          <button onClick={onClose}>
            <X className="text-text-tertiary hover:text-text-primary h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-6 py-4">
          <p className="text-text-tertiary text-[13px] leading-relaxed">
            Tạo một bản sao của vai trò <strong className="text-text-primary">{role.name}</strong> với các quyền hạn
            tương tự.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[13px] font-medium">Tên vai trò mới *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="!h-12" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[13px] font-medium">Mã vai trò mới *</label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="!h-12" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[13px] font-medium">Mô tả</label>
            <textarea
              className="rounded-btn text-text-primary w-full resize-none border px-3.5 py-2.5 text-[13px] outline-none"
              style={{ height: "60px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-4.5 h-4.5 flex items-center justify-center rounded-[4px]"
              style={{ background: copyPerms ? "#00C7A5" : "#3A4352" }}
              onClick={() => setCopyPerms(!copyPerms)}
            >
              {copyPerms && <Check className="h-3 w-3 text-white" />}
            </button>
            <span className="text-text-primary text-[13px]">Sao chép toàn bộ quyền từ vai trò hiện tại</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="secondary" onClick={onClose}>
            <X className="h-4 w-4" /> Hủy
          </Button>
          <Button
            disabled={mutation.isPending || !name || !code}
            isLoading={mutation.isPending}
            leftIcon={mutation.isPending ? undefined : <Copy className="h-4 w-4" />}
            onClick={() =>
              mutation.mutate({
                code,
                name,
                ...(description ? { description } : {}),
                permissionIds: copyPerms ? [] : [],
              })
            }
          >
            {mutation.isPending ? "Đang tạo..." : "Tạo bản sao"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteBlockedModal({ role, onClose }: { role: { name: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="rounded-card w-[480px] border"
        style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pb-0 pt-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[16px]"
            style={{ background: "rgba(240,82,82,0.12)" }}
          >
            <AlertTriangle className="text-semantic-error h-5 w-5" />
          </div>
          <h3 className="text-text-primary text-[18px] font-semibold" style={{ fontFamily: "Manrope" }}>
            Không thể xóa vai trò
          </h3>
        </div>
        <div className="flex flex-col gap-4 px-6 py-4">
          <p className="text-text-primary text-[14px] leading-relaxed">
            Vai trò <strong>{role.name}</strong> đang được gán cho người dùng và không thể xóa.
          </p>
          <div className="rounded-btn flex flex-col gap-2 p-4" style={{ background: "#101B2B" }}>
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary text-[13px]">Người dùng đang sử dụng</span>
              <span className="text-semantic-error text-[20px] font-bold" style={{ fontFamily: "Manrope" }}>
                —
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary text-[13px]">Loại vai trò</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[12px]"
                style={{ background: "rgba(0,174,239,0.14)", color: "#00AEEF" }}
              >
                Hệ thống
              </span>
            </div>
          </div>
          <p className="text-text-tertiary text-[12px] leading-relaxed">
            Vai trò hệ thống không thể bị xóa. Hãy chuyển người dùng sang vai trò khác trước khi thử lại.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            className="rounded-btn h-11 border px-5 text-[13px] font-medium"
            style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
          >
            Xem người dùng
          </button>
          <button
            className="rounded-btn h-11 px-5 text-[13px] font-medium"
            style={{ background: "#3A4352", color: "#F8FAFC" }}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function getAllPermIds(
  tree?: { permissions: { id: string }[]; children: { permissions: { id: string }[] }[] }[]
): string[] {
  if (!tree) return [];
  return tree.flatMap((g) => [
    ...g.permissions.map((p) => p.id),
    ...(g.children || []).flatMap((c) => c.permissions.map((p) => p.id)),
  ]);
}
