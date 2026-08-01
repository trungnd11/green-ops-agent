import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Shield, Plus, Edit3, Trash2, X, FolderOpen } from "lucide-react";
import { notification } from "@xanh/ui/notification";
import {
  fetchPermissionTree,
  type ModuleTreeNode,
  type PermissionNode,
  createModule,
  updateModule,
  deleteModule,
  createPermission,
  updatePermission,
  deletePermission,
} from "../api/permission.api";

export function PermissionPage() {
  const queryClient = useQueryClient();
  const { data: tree } = useQuery({
    queryKey: ["permissions", "tree"],
    queryFn: fetchPermissionTree,
    staleTime: 5 * 60_000,
  });

  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [moduleModal, setModuleModal] = useState<{ open: boolean; edit?: ModuleTreeNode; parentId?: string }>({ open: false });
  const [permModal, setPermModal] = useState<{ open: boolean; edit?: PermissionNode; moduleId?: string }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ type: "module" | "permission"; id: string; name: string } | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const findModule = (nodes: ModuleTreeNode[], id: string): ModuleTreeNode | null => {
    for (const n of nodes) {
      if (n.moduleId === id) return n;
      const found = findModule(n.children ?? [], id);
      if (found) return found;
    }
    return null;
  };

  const findParentId = (nodes: ModuleTreeNode[], targetId: string): string | null => {
    for (const n of nodes) {
      if ((n.children ?? []).some((c) => c.moduleId === targetId)) return n.moduleId;
      const found = findParentId(n.children ?? [], targetId);
      if (found) return found;
    }
    return null;
  };

  const activeModule = selectedModule && tree ? findModule(tree, selectedModule) : null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
  };

  const renderTree = (nodes: ModuleTreeNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const isExpanded = expanded.has(node.moduleId);
      const hasChildren = (node.children?.length ?? 0) > 0;
      return (
        <div key={node.moduleId}>
          <div className="group relative" style={{ paddingLeft: 16 + depth * 20 }}>
            <button
              className="hover:bg-bg-subtle flex w-full items-center gap-2 py-2.5 pr-24 text-left transition-colors"
              style={{
                background: selectedModule === node.moduleId ? "rgba(0,199,165,0.14)" : "transparent",
              }}
              onClick={() => {
                setSelectedModule(node.moduleId);
                if (hasChildren) toggleExpand(node.moduleId);
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="text-text-tertiary h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="text-text-tertiary h-3.5 w-3.5 shrink-0" />
                )
              ) : (
                <div className="w-3.5" />
              )}
              <span
                className="truncate text-[13px] font-medium"
                style={{ color: selectedModule === node.moduleId ? "#00C7A5" : "#F8FAFC" }}
              >
                {node.moduleName}
              </span>
              <span className="text-text-tertiary ml-auto shrink-0 text-[11px]">{node.permissions.length}</span>
            </button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex">
              <button
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
                onClick={() => setModuleModal({ open: true, edit: node })}
                title="Sửa module"
              >
                <Edit3 className="h-3 w-3 text-text-tertiary" />
              </button>
              <button
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
                onClick={() => setModuleModal({ open: true, parentId: node.moduleId })}
                title="Thêm module con"
              >
                <Plus className="h-3 w-3 text-text-tertiary" />
              </button>
              <button
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-red-500/20"
                onClick={() => setDeleteTarget({ type: "module", id: node.moduleId, name: node.moduleName })}
                title="Xóa module"
              >
                <Trash2 className="h-3 w-3 text-semantic-error" />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Phân quyền hệ thống
          </h1>
          <p className="text-text-secondary text-[13px]">Xem và quản lý các quyền hạn trong hệ thống theo từng module.</p>
        </div>
        <button
          className="rounded-btn bg-brand-teal flex items-center gap-1.5 px-5 text-[14px] font-semibold text-white"
          style={{ height: "44px" }}
          onClick={() => setModuleModal({ open: true })}
        >
          <Plus className="h-4 w-4" /> Thêm module
        </button>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 260px)" }}>
        {/* Left: Module Tree */}
        <div
          className="rounded-card flex w-[320px] shrink-0 flex-col border"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <span className="text-text-primary text-[14px] font-semibold" style={{ fontFamily: "Manrope" }}>
              Module
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tree ? (
              renderTree(tree)
            ) : (
              <div className="text-text-tertiary flex items-center justify-center py-8 text-[13px]">Đang tải...</div>
            )}
          </div>
        </div>

        {/* Right: Permissions */}
        <div
          className="rounded-card flex flex-1 flex-col border"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div className="border-b flex items-center justify-between px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <div>
              <span className="text-text-primary text-[14px] font-semibold" style={{ fontFamily: "Manrope" }}>
                {activeModule ? activeModule.moduleName : "Quyền hạn"}
              </span>
              {activeModule && (
                <span className="text-text-tertiary ml-2 text-[12px]">({activeModule.permissions.length} quyền)</span>
              )}
            </div>
            {activeModule && (
              <button
                className="rounded-btn bg-brand-teal flex items-center gap-1.5 px-4 text-[12px] font-medium text-white"
                style={{ height: "32px" }}
                onClick={() => setPermModal({ open: true, moduleId: selectedModule! })}
              >
                <Plus className="h-3.5 w-3.5" /> Thêm quyền
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {activeModule ? (
              <div className="flex flex-wrap gap-2">
                {activeModule.permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="rounded-btn flex flex-col gap-1 px-3 py-2 group relative"
                    style={{ background: "#101B2B", width: "calc(33.33% - 6px)", minWidth: 200 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary truncate text-[13px] font-medium">{perm.name}</span>
                      <div className="hidden items-center gap-0.5 group-hover:flex">
                        <button
                          className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10"
                          onClick={() => setPermModal({ open: true, edit: perm, moduleId: selectedModule! })}
                        >
                          <Edit3 className="h-3 w-3 text-text-tertiary" />
                        </button>
                        <button
                          className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-500/20"
                          onClick={() => setDeleteTarget({ type: "permission", id: perm.id, name: perm.name })}
                        >
                          <Trash2 className="h-3 w-3 text-semantic-error" />
                        </button>
                      </div>
                    </div>
                    <span className="text-text-tertiary truncate font-mono text-[11px]">{perm.code}</span>
                    {perm.description && (
                      <span className="text-text-disabled truncate text-[11px]">{perm.description}</span>
                    )}
                  </div>
                ))}
                {activeModule.children?.map((child) => (
                  <div key={child.moduleId} className="mt-2 w-full">
                    <span className="text-text-secondary mb-2 block text-[12px] font-semibold">{child.moduleName}</span>
                    <div className="flex flex-wrap gap-2">
                      {child.permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className="rounded-btn flex flex-col gap-1 px-3 py-2 group relative"
                          style={{ background: "#101B2B", width: "calc(33.33% - 6px)", minWidth: 200 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-text-primary truncate text-[13px] font-medium">{perm.name}</span>
                            <div className="hidden items-center gap-0.5 group-hover:flex">
                              <button
                                className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10"
                                onClick={() => setPermModal({ open: true, edit: perm, moduleId: child.moduleId })}
                              >
                                <Edit3 className="h-3 w-3 text-text-tertiary" />
                              </button>
                              <button
                                className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-500/20"
                                onClick={() => setDeleteTarget({ type: "permission", id: perm.id, name: perm.name })}
                              >
                                <Trash2 className="h-3 w-3 text-semantic-error" />
                              </button>
                            </div>
                          </div>
                          <span className="text-text-tertiary truncate font-mono text-[11px]">{perm.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <Shield className="text-text-disabled h-10 w-10" />
                <span className="text-text-tertiary text-[14px]">Chọn một module để xem quyền hạn</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Modal */}
      {moduleModal.open && (
        <ModuleFormModal
          edit={moduleModal.edit}
          parentId={moduleModal.parentId}
          onClose={() => setModuleModal({ open: false })}
          onDone={invalidate}
        />
      )}

      {/* Permission Modal */}
      {permModal.open && (
        <PermissionFormModal
          edit={permModal.edit}
          moduleId={permModal.moduleId!}
          onClose={() => setPermModal({ open: false })}
          onDone={invalidate}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={() => {
            setDeleteTarget(null);
            invalidate();
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function ModuleFormModal({ edit, parentId, onClose, onDone }: { edit: ModuleTreeNode | undefined; parentId: string | undefined; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState(edit?.moduleCode ?? "");
  const [name, setName] = useState(edit?.moduleName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!code.trim() || !name.trim()) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true);
    try {
      if (edit) {
        await updateModule(edit.moduleId, { code, name, moduleType: "MODULE" });
        notification.success({ message: "Cập nhật module thành công", placement: "bottomRight" });
      } else {
        const modData: { code: string; name: string; parentId?: string; moduleType: string } = { code, name, moduleType: parentId ? "MODULE" : "GROUP" };
        if (parentId) modData.parentId = parentId;
        await createModule(modData);
        notification.success({ message: parentId ? "Thêm module con thành công" : "Thêm module thành công", placement: "bottomRight" });
      }
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[460px] rounded-card border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(0,174,239,0.12)" }}>
              <FolderOpen className="h-5 w-5" style={{ color: "#00AEEF" }} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>{edit ? "Sửa module" : parentId ? "Thêm module con" : "Thêm module"}</h3>
            </div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-text-tertiary" /></button>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary">Mã module</label>
            <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: IAM" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary">Tên module</label>
            <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: Quản trị hệ thống" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-semantic-error text-[12px]">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="rounded-btn border px-4 h-10 text-[13px] font-medium" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }} onClick={onClose}>Hủy</button>
            <button className="rounded-btn px-4 h-10 text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60" style={{ background: "#00C7A5", color: "#F8FAFC" }} disabled={loading} onClick={handleSubmit}>
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {edit ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionFormModal({ edit, moduleId, onClose, onDone }: { edit: PermissionNode | undefined; moduleId: string; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState(edit?.code ?? "");
  const [name, setName] = useState(edit?.name ?? "");
  const [resource, setResource] = useState(edit?.resource ?? "");
  const [action, setAction] = useState(edit?.action ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!code.trim() || !name.trim() || !resource.trim() || !action.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      const payload = { moduleId, code, name, resource, action, permissionType: "API" };
      if (edit) {
        await updatePermission(edit.id, { ...payload, status: "ACTIVE" });
        notification.success({ message: "Cập nhật quyền thành công", placement: "bottomRight" });
      } else {
        await createPermission(payload);
        notification.success({ message: "Thêm quyền thành công", placement: "bottomRight" });
      }
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[460px] rounded-card border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(0,199,165,0.12)" }}>
              <Shield className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>{edit ? "Sửa quyền" : "Thêm quyền"}</h3>
            </div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-text-tertiary" /></button>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Mã quyền</label>
              <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: iam.user.list" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Tên quyền</label>
              <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: Xem danh sách" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Resource</label>
              <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: user" value={resource} onChange={(e) => setResource(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary">Action</label>
              <input className="rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-disabled" style={{ height: "44px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B", color: "#F8FAFC" }} placeholder="VD: list" value={action} onChange={(e) => setAction(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-semantic-error text-[12px]">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="rounded-btn border px-4 h-10 text-[13px] font-medium" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }} onClick={onClose}>Hủy</button>
            <button className="rounded-btn px-4 h-10 text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60" style={{ background: "#00C7A5", color: "#F8FAFC" }} disabled={loading} onClick={handleSubmit}>
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {edit ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ target, onClose, onDone }: { target: { type: "module" | "permission"; id: string; name: string }; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (target.type === "module") await deleteModule(target.id);
      else await deletePermission(target.id);
      notification.success({ message: "Xóa thành công", placement: "bottomRight" });
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[400px] rounded-card border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>Xác nhận xóa</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-text-tertiary" /></button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-text-tertiary">Bạn có chắc chắn muốn xóa <strong className="text-text-primary">{target.name}</strong>?</p>
          {error && <p className="text-semantic-error text-[12px] mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-5">
            <button className="rounded-btn border px-4 h-10 text-[13px] font-medium" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }} onClick={onClose}>Hủy</button>
            <button className="rounded-btn px-4 h-10 text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60" style={{ background: "#F05252", color: "#fff" }} disabled={loading} onClick={handleDelete}>
              {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
