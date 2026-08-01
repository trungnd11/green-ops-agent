import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, ShieldCheck, Clock, Edit3, Lock, AlertTriangle, X, ChevronDown, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { notification } from "@xanh/ui/notification";
import { fetchUser, fetchUserCompanies, deactivateUser, fetchUserRoles, fetchAllRoles, replaceUserRoles } from "../api/user.api";
import { fetchAuditLogs } from "../../audit-log/api/audit-log.api";
import { ADMIN_ROUTES } from "../constants";
const statusLabel: Record<string, string> = { active: "Đang hoạt động", inactive: "Vô hiệu hóa" };
const statusColor: Record<string, string> = { active: "#22C55E", inactive: "#8792A2" };

const tabs = ["Tổng quan", "Vai trò & Phân quyền", "Công ty", "Nhật ký hoạt động"];

export function UserDetailPage() {
  const { userId } = useParams({ from: "/_authenticated/admin/users/$userId" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockNote, setLockNote] = useState("");
  const [lockDropdownOpen, setLockDropdownOpen] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showAssignRoles, setShowAssignRoles] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const { data: allRoles } = useQuery({
    queryKey: ["all-roles"],
    queryFn: () => fetchAllRoles(),
    enabled: showAssignRoles,
    staleTime: 30000,
  });

  const lockReasons = [
    "Vi phạm chính sách",
    "Tài khoản không hoạt động",
    "Yêu cầu từ quản lý",
    "Bảo mật bị xâm phạm",
    "Khác",
  ];

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 0,
  });

  const { data: companies } = useQuery({
    queryKey: ["user-companies", userId],
    queryFn: () => fetchUserCompanies(userId),
    enabled: tab === 2,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => fetchUserRoles(userId),
    enabled: tab === 1,
  });

  const [auditPage, setAuditPage] = useState(0);
  const { data: userAuditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["user-audit-logs", userId, auditPage],
    queryFn: () => fetchAuditLogs({ entityId: userId, page: auditPage, size: 10 }),
    enabled: tab === 3,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-6 w-48 rounded" style={{ background: "#3A4352" }} />
        <div className="rounded-card border p-6" style={{ height: 140, borderColor: "rgba(255,255,255,0.12)" }} />
        <div className="rounded-card border p-6 flex-1" style={{ borderColor: "rgba(255,255,255,0.12)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-[16px] font-semibold text-text-primary">Không tìm thấy người dùng</span>
        <Button variant="secondary" onClick={() => navigate({ to: ADMIN_ROUTES.LIST } as any)}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-8 h-16 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-btn border"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }}
          onClick={() => navigate({ to: ADMIN_ROUTES.LIST } as any)}
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <span className="text-[13px] text-text-tertiary flex items-center gap-1.5">
          <span>Quản trị hệ thống</span>
          <ChevronRight className="h-3 w-3" />
          <span className="cursor-pointer hover:text-text-secondary" onClick={() => navigate({ to: ADMIN_ROUTES.LIST } as any)}>
            Quản lý người dùng
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-primary">Chi tiết người dùng</span>
        </span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-2 rounded-btn px-5 text-[14px] font-semibold"
          style={{ height: "40px", background: "#00C7A5", color: "#F8FAFC" }}
          onClick={() => navigate({ to: ADMIN_ROUTES.EDIT(userId) } as any)}
        >
          <Edit3 className="h-4 w-4" /> Chỉnh sửa
        </button>
        <button
          className="flex items-center gap-2 rounded-btn border px-5 text-[14px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ height: "40px", borderColor: user.status === "inactive" ? "#8792A2" : "#F05252", color: user.status === "inactive" ? "#8792A2" : "#F05252", background: user.status === "inactive" ? "rgba(135,146,162,0.1)" : "rgba(240,82,82,0.1)" }}
          disabled={user.status === "inactive"}
          onClick={() => setShowLockModal(true)}
        >
          <Lock className="h-4 w-4" /> {user.status === "inactive" ? "Đã khóa" : "Khóa tài khoản"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {/* User Header */}
        <div className="rounded-card border p-6 flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#00C7A5" }}>
            <span className="text-xl font-bold text-text-inverse">{user.fullName?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: "Manrope" }}>{user.fullName}</h1>
              <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: `${statusColor[user.status]}1a`, color: statusColor[user.status] }}>
                {statusLabel[user.status]}
              </span>
            </div>
            <span className="text-[13px] text-text-tertiary">@{user.username}</span>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[13px] text-text-secondary">{user.email || "—"}</span>
              <span className="text-[12px] text-text-tertiary">|</span>
              <span className="text-[13px] text-text-secondary">{user.phone || "—"}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-[10px]" style={{ background: "#101B2B", width: "fit-content" }}>
          {tabs.map((t, i) => (
            <button
              key={t}
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{ background: tab === i ? "#1C2737" : "transparent", color: tab === i ? "#F8FAFC" : "#8792A2" }}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && (
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                <h3 className="text-[15px] font-semibold text-text-primary mb-3" style={{ fontFamily: "Manrope" }}>Thông tin cá nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Họ và tên", value: user.fullName },
                    { label: "Email", value: user.email || "—" },
                    { label: "Số điện thoại", value: user.phone || "—" },
                    { label: "Tên đăng nhập", value: user.username },
                    { label: "Trạng thái", value: statusLabel[user.status] || user.status },
                    { label: "Lần đăng nhập cuối", value: user.lastLogin ? new Date(user.lastLogin).toLocaleString("vi-VN") : "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5">
                      <span className="text-[12px] text-text-tertiary">{row.label}</span>
                      <span className="text-[13px] text-text-primary">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-[380px] shrink-0 flex flex-col gap-4">
              <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                <h3 className="text-[15px] font-semibold text-text-primary mb-3" style={{ fontFamily: "Manrope" }}>Bảo mật</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-teal" />
                    <span className="text-[13px] text-text-primary">Xác thực hai lớp (2FA)</span>
                  </div>
                  <span className="text-[12px] text-text-tertiary">Chưa bật</span>
                </div>
              </div>
              <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                <h3 className="text-[15px] font-semibold text-text-primary mb-3" style={{ fontFamily: "Manrope" }}>Công ty</h3>
                <span className="text-[13px] text-text-tertiary">{user.companyName || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="flex gap-6">
            <div className="w-[380px] shrink-0 flex flex-col gap-4">
              <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                <h3 className="text-[16px] font-semibold text-text-primary mb-4" style={{ fontFamily: "Manrope" }}>Vai trò được gán</h3>
                {!userRoles ? (
                  <div className="flex flex-col gap-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: "#3A4352" }} />
                        <div className="flex-1 h-4 rounded animate-pulse" style={{ background: "#3A4352", width: "60%" }} />
                      </div>
                    ))}
                  </div>
                ) : (userRoles?.roles ?? []).length === 0 ? (
                  <span className="text-[13px] text-text-tertiary py-4 text-center">Chưa có vai trò nào</span>
                ) : (
                  <div className="flex flex-col">
                    {(userRoles?.roles ?? []).map((r, i) => (
                      <div key={r.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < (userRoles?.roles ?? []).length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                        <div className="flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0" style={{ background: "rgba(87,73,244,0.2)", color: "#8B7CF7" }}>
                          {r.code}
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span className="text-[13px] font-medium text-text-primary">{r.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {userRoles && (
                  <button className="flex items-center gap-2 rounded-btn px-5 h-11 text-[14px] font-semibold self-start mt-4" style={{ background: "#00C7A5", color: "#F8FAFC" }} onClick={() => { setSelectedRoleIds((userRoles?.roles ?? []).map(r => r.id)); setShowAssignRoles(true); }}>
                    + Gán thêm vai trò
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>Quyền hiệu lực</h3>
                <p className="text-[12px] text-text-tertiary mt-0.5 mb-4">Tổng hợp quyền từ tất cả vai trò được gán</p>
                {!userRoles ? (
                  <div className="flex flex-col gap-4">
                    {[1,2,3].map((g) => (
                      <div key={g}>
                        <div className="h-4 w-24 rounded animate-pulse mb-2" style={{ background: "#3A4352" }} />
                        {[1,2].map((p) => (
                          <div key={p} className="flex items-center gap-2.5 py-1.5 pl-6">
                            <div className="w-[6px] h-[6px] rounded-full animate-pulse" style={{ background: "#3A4352" }} />
                            <div className="h-3.5 w-36 rounded animate-pulse" style={{ background: "#3A4352" }} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (userRoles?.permissionGroups ?? []).length === 0 ? (
                  <span className="text-[13px] text-text-tertiary py-4 block text-center">Chưa có quyền nào</span>
                ) : (
                  <div className="flex flex-col gap-4">
                    {(userRoles?.permissionGroups ?? []).map((group) => (
                      <div key={group.module}>
                        <div className="flex items-center gap-2.5 py-2 px-0">
                          <span className="text-[13px] font-semibold text-text-primary">{group.module}</span>
                        </div>
                        {group.permissions.map((perm) => (
                          <div key={perm.code} className="flex items-center gap-2.5 py-1.5 pl-6">
                            <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "#00C7A5" }} />
                            <span className="text-[13px] text-text-secondary">{perm.name}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>Công ty trực thuộc</h3>
            </div>
            {!companies ? (
              <div className="flex flex-col gap-3">
                {[1,2].map((i) => (
                  <div key={i} className="rounded-card border p-5 flex items-center gap-4 animate-pulse" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                    <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "#3A4352" }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 w-48 rounded" style={{ background: "#3A4352" }} />
                      <div className="h-3 w-28 rounded" style={{ background: "#3A4352" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-[13px] text-text-tertiary py-8 text-center">Người dùng chưa thuộc công ty nào.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {companies.map((c) => (
                  <div key={c.companyId} className="rounded-card border p-5 flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style={{ background: "#00AEEF" }}>
                      <span className="text-[16px] font-bold text-text-inverse">{c.companyName?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-text-primary">{c.companyName}</span>
                        <span className="text-[12px] text-text-disabled">{c.companyCode}</span>
                        {c.defaultCompany && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,199,165,0.14)", color: "#00C7A5" }}>
                            Mặc định
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-text-tertiary">{c.active ? "Đang hoạt động" : "Không hoạt động"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 3 && (
          <Table<any>
            columns={[
              {
                title: "Thời gian",
                dataIndex: "createdAt",
                width: 170,
                render: (text: string) => (
                  <span className="text-text-primary text-[13px]">{text ? new Date(text).toLocaleString("vi-VN") : "—"}</span>
                ),
              },
              {
                title: "Hành động",
                dataIndex: "action",
                render: (text: string) => (
                  <span className="text-text-primary text-[13px]">{text}</span>
                ),
              },
              {
                title: "Chi tiết",
                key: "detail",
                render: (_: string, record: any) => (
                  <span className="text-text-tertiary text-[12px]">{record.entityType} {record.entityId?.slice(0, 8)}</span>
                ),
              },
            ]}
            dataSource={userAuditLogs?.items ?? []}
            isLoading={auditLoading}
            rowKey="id"
            pagination={{
              current: auditPage + 1,
              pageSize: 10,
              total: userAuditLogs?.totalElements ?? 0,
              onChange: (p: number) => setAuditPage(p - 1),
            }}
          />
        )}
      </div>

      {showAssignRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignRoles(false)}>
          <div className="w-[560px] rounded-card border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h2 className="text-[18px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>Phân quyền vai trò</h2>
              <button onClick={() => setShowAssignRoles(false)}><X className="h-5 w-5 text-text-tertiary hover:text-text-primary" /></button>
            </div>
            <div className="flex flex-col gap-3 px-6 py-5 max-h-[60vh] overflow-y-auto">
              {!allRoles ? (
                <div className="flex flex-col gap-3 py-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="flex items-center gap-3.5 py-2.5">
                      <div className="w-5 h-5 rounded animate-pulse shrink-0" style={{ background: "#3A4352" }} />
                      <div className="flex-1">
                        <div className="h-4 w-1/3 rounded animate-pulse" style={{ background: "#3A4352" }} />
                        <div className="h-3 w-1/2 rounded animate-pulse mt-1" style={{ background: "#3A4352" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allRoles.length === 0 ? (
                <span className="text-[13px] text-text-tertiary py-4 text-center">Không có vai trò nào</span>
              ) : (
                allRoles.map((role) => {
                  const checked = selectedRoleIds.includes(role.id);
                  return (
                    <div key={role.id} className="flex items-center gap-3.5 py-2.5 cursor-pointer select-none" onClick={() => setSelectedRoleIds(prev => checked ? prev.filter(id => id !== role.id) : [...prev, role.id])}>
                      <div className="flex items-center justify-center w-5 h-5 rounded shrink-0" style={{ background: checked ? "#00C7A5" : "transparent", border: checked ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium text-text-primary">{role.name}</span>
                        <span className="text-[12px] text-text-tertiary">{role.code}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button className="rounded-btn border px-5 h-11 text-[14px] font-medium" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC", background: "transparent" }} onClick={() => setShowAssignRoles(false)}>Hủy</button>
              <button
                className="rounded-btn px-5 h-11 text-[14px] font-semibold flex items-center gap-2 disabled:opacity-60"
                style={{ background: "#00C7A5", color: "#F8FAFC" }}
                disabled={assignLoading}
                onClick={async () => {
                  setAssignLoading(true);
                  try {
                    await replaceUserRoles(user.id, selectedRoleIds);
                    queryClient.invalidateQueries({ queryKey: ["user-roles"] });
                    setShowAssignRoles(false);
                    notification.success({ message: "Phân quyền thành công", placement: "bottomRight" });
                  } catch (err: any) {
                    notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
                  } finally {
                    setAssignLoading(false);
                  }
                }}
              >
                {assignLoading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : null}
                Lưu phân quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLockModal(false)}>
          <div className="w-[480px] rounded-card border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h2 className="text-[18px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>Khóa tài khoản</h2>
              <button onClick={() => setShowLockModal(false)}>
                <X className="h-5 w-5 text-text-tertiary hover:text-text-primary" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 px-6 py-5">
              {/* Alert */}
              <div className="flex items-center gap-3 rounded-[14px] px-4 py-3" style={{ background: "rgba(240,82,82,0.1)" }}>
                <AlertTriangle className="h-[18px] w-[18px] shrink-0" style={{ color: "#F05252" }} />
                <span className="text-[13px] font-medium" style={{ color: "#F05252" }}>
                  Hành động này sẽ ngăn người dùng truy cập hệ thống và tất cả dịch vụ liên quan.
                </span>
              </div>

              {/* Lý do khóa */}
              <div className="flex flex-col gap-1.5" style={{ position: "relative" }}>
                <label className="text-[13px] font-medium text-text-secondary">Lý do khóa</label>
                <div
                  className="flex items-center rounded-btn border px-4 cursor-pointer select-none"
                  style={{ height: "48px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }}
                  onClick={() => setLockDropdownOpen(!lockDropdownOpen)}
                >
                  <span className="flex-1 text-[14px]" style={{ color: lockReason ? "#F8FAFC" : "rgba(135,146,162,0.5)" }}>
                    {lockReason || "Chọn lý do khóa..."}
                  </span>
                  <ChevronDown className="h-[18px] w-[18px] text-text-tertiary" style={{ transform: lockDropdownOpen ? "rotate(180deg)" : "none" }} />
                </div>
                {lockDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 z-10 mt-1 rounded-btn border overflow-hidden"
                    style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
                  >
                    {lockReasons.map((r) => (
                      <div
                        key={r}
                        className="px-4 py-2.5 text-[13px] cursor-pointer transition-colors"
                        style={{ color: lockReason === r ? "#00C7A5" : "#F8FAFC", background: lockReason === r ? "rgba(0,199,165,0.08)" : "transparent" }}
                        onClick={() => { setLockReason(r); setLockDropdownOpen(false); }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = lockReason === r ? "rgba(0,199,165,0.08)" : "transparent"}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ghi chú thêm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-text-secondary">Ghi chú thêm</label>
                <textarea
                  className="w-full rounded-btn border px-4 py-3 text-[14px] text-text-primary outline-none resize-none placeholder:text-text-disabled"
                  style={{ height: "80px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }}
                  placeholder="Nhập ghi chú..."
                  value={lockNote}
                  onChange={(e) => setLockNote(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                className="rounded-btn border px-5 h-11 text-[14px] font-medium"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC", background: "transparent" }}
                onClick={() => { setShowLockModal(false); setLockReason(""); setLockNote(""); setLockDropdownOpen(false); }}
              >
                Hủy
              </button>
              <button
                className="rounded-btn border px-5 h-11 text-[14px] font-medium flex items-center gap-2 disabled:opacity-60"
                style={{ borderColor: "#F05252", color: "#F05252", background: "rgba(240,82,82,0.1)" }}
                disabled={lockLoading}
                onClick={() => {
                  setLockLoading(true);
                  deactivateUser(user.id, lockReason || undefined, lockNote || undefined).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                    navigate({ to: ADMIN_ROUTES.LIST } as any);
                  }).catch((err: Error) => {
                    setLockLoading(false);
                    notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
                  });
                }}
              >
                {lockLoading ? (
                  <svg className="h-4 w-4 animate-spin" style={{ color: "#F05252" }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {lockLoading ? "Đang khóa..." : "Khóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
