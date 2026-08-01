import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Smartphone, ShieldCheck, Trash2, Save } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { Popconfirm } from "@xanh/ui/popconfirm";
import { Dialog } from "@xanh/ui/dialog";
import { notification } from "@xanh/ui/notification";
import {
  fetchUser,
  updateUser,
  fetchUserCompanies,
  addUserToCompany,
  removeUserFromCompany,
  fetchAllCompanies,
} from "../api/user.api";
import { fetch2FAStatus, setup2FA, enable2FA, disable2FA } from "../../twofa/api/twofa.api";
import { ADMIN_ROUTES } from "../constants";

const statusOptions = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Vô hiệu hóa" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className="relative rounded-full transition-colors"
      style={{ width: "44px", height: "24px", background: checked ? "#00C7A5" : "#3A4352" }}
      onClick={onChange}
    >
      <div
        className="absolute top-0.5 rounded-full transition-transform"
        style={{
          width: "18px",
          height: "18px",
          background: "#000",
          transform: checked ? "translateX(22px)" : "translateX(4px)",
        }}
      />
    </button>
  );
}

const tabs = ["Thông tin tài khoản", "Thông tin cá nhân", "Công ty", "Cấu hình"];

export function UserEditPage() {
  const { userId } = useParams({ from: "/_authenticated/admin/users/$userId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyApp, setNotifyApp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 0,
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showAddCompany, setShowAddCompany] = useState(false);

  useEffect(() => {
    fetch2FAStatus()
      .then((s) => setTwoFAEnabled(s.enabled))
      .catch(() => {});
  }, []);

  const vals = useRef({ username: "", fullName: "", email: "", phone: "", status: "active" });

  const [, setRenderTick] = useState(0);

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
    if (vals.current.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.current.email)) errs.email = "Email không hợp lệ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { fullName: vals.current.fullName, status: vals.current.status };
      if (vals.current.email) payload.email = vals.current.email;
      if (vals.current.phone) payload.phone = vals.current.phone;
      await updateUser(userId, payload);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (twoFAEnabled) {
      setTwoFALoading(true);
      try {
        await disable2FA();
        setTwoFAEnabled(false);
        setShowQr(false);
      } catch (err) {
        notification.error({ message: "Lỗi", description: (err as Error).message, placement: "bottomRight" });
      } finally {
        setTwoFALoading(false);
      }
    } else {
      setTwoFALoading(true);
      try {
        const status = await setup2FA();
        setQrUrl(status.qrCodeUrl);
        setShowQr(true);
      } catch (err) {
        notification.error({ message: "Lỗi", description: (err as Error).message, placement: "bottomRight" });
      } finally {
        setTwoFALoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError("");
    setTwoFALoading(true);
    try {
      await enable2FA(otpInput);
      setTwoFAEnabled(true);
      setShowQr(false);
      setOtpInput("");
    } catch (err) {
      setOtpError((err as Error).message || "Mã OTP không hợp lệ");
    } finally {
      setTwoFALoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4">
        <div className="h-5 w-48 rounded" style={{ background: "#3A4352" }} />
        <div className="h-4 w-64 rounded" style={{ background: "#3A4352" }} />
        <div className="rounded-card border" style={{ height: 500, borderColor: "rgba(255,255,255,0.12)" }} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <span className="text-text-primary text-[16px] font-semibold">Không thể tải thông tin người dùng</span>
        <Button
          variant="secondary"
          onClick={() => navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any })}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-[20px] font-semibold" style={{ fontFamily: "Manrope" }}>
            Sửa người dùng
          </h1>
          <p className="text-text-tertiary text-[13px]">Cập nhật thông tin tài khoản người dùng.</p>
        </div>
        <button
          className="rounded-btn bg-bg-subtle flex h-9 w-9 items-center justify-center"
          onClick={() => navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any })}
        >
          <X className="text-text-secondary h-[18px] w-[18px]" />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div
          className="rounded-card flex flex-col border"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div
            className="mx-6 mt-5 flex items-center gap-1 rounded-[10px] p-1"
            style={{ background: "#101B2B", width: "fit-content" }}
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                type="button"
                className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                style={{ background: tab === i ? "#1C2737" : "transparent", color: tab === i ? "#F8FAFC" : "#8792A2" }}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
            {tab === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                  Thông tin tài khoản
                </h2>
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium">Tên đăng nhập</span>
                  <input
                    value={v("username")}
                    disabled
                    className="rounded-btn text-text-tertiary w-full border px-3.5 text-[13px] outline-none"
                    style={{ height: "48px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium">Công ty</span>
                  <input
                    value={user?.companyName || "—"}
                    disabled
                    className="rounded-btn text-text-tertiary w-full border px-3.5 text-[13px] outline-none"
                    style={{ height: "48px", borderColor: "rgba(255,255,255,0.12)", background: "#3A4352" }}
                  />
                </div>
              </div>
            )}

            {tab === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                  Thông tin cá nhân
                </h2>
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium">
                    Họ tên <span className="text-semantic-error">*</span>
                  </span>
                  <Input
                    value={v("fullName")}
                    onChange={(e) => sv("fullName", e.target.value)}
                    placeholder="Nhập họ tên"
                    hasError={!!errors.fullName}
                  />
                  {errors.fullName && (
                    <span className="text-semantic-error text-[11px] leading-none">{errors.fullName}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium">Email</span>
                  <Input
                    value={v("email")}
                    onChange={(e) => sv("email", e.target.value)}
                    placeholder="nhập địa chỉ email..."
                    hasError={!!errors.email}
                  />
                  {errors.email && <span className="text-semantic-error text-[11px] leading-none">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary text-[13px] font-medium">Số điện thoại</span>
                  <Input
                    value={v("phone")}
                    onChange={(e) => sv("phone", e.target.value)}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
              </div>
            )}

            {tab === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                    Công ty
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCompany(true);
                    }}
                    className="text-brand-cyan text-[13px] hover:underline"
                  >
                    + Thêm công ty
                  </button>
                </div>
                <p className="text-text-tertiary text-[13px]">Danh sách công ty người dùng này thuộc về.</p>
                <UserCompaniesList userId={userId} />
                <AddCompanyDialog
                  userId={userId}
                  open={showAddCompany}
                  onClose={() => setShowAddCompany(false)}
                  queryClient={queryClient}
                />
              </div>
            )}

            {tab === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <h2 className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                    Trạng thái
                  </h2>
                  <Select
                    value={v("status")}
                    onValueChange={(val: string) => sv("status", val)}
                    options={statusOptions}
                  />
                </div>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.12)" }} />
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-brand-teal h-4 w-4" />
                      <span className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                        Yêu cầu xác thực hai lớp (2FA)
                      </span>
                    </div>
                    <Toggle checked={twoFAEnabled} onChange={handleToggle2FA} />
                  </div>
                  <p className="text-text-tertiary text-[12px] leading-relaxed">
                    {twoFAEnabled
                      ? "Tài khoản đã được bảo vệ bằng xác thực hai lớp."
                      : "Bảo vệ tài khoản bằng xác thực hai lớp qua ứng dụng Authenticator."}
                  </p>
                  <Dialog
                    open={showQr && !!qrUrl && !twoFAEnabled}
                    onOpenChange={(open) => {
                      if (!open) {
                        setShowQr(false);
                        setOtpInput("");
                        setOtpError("");
                      }
                    }}
                  >
                    <div className="flex flex-col items-center gap-4 py-2">
                      <Smartphone className="text-brand-cyan h-8 w-8" />
                      <div className="text-center">
                        <p className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                          Quét mã QR
                        </p>
                        <p className="text-text-tertiary mt-1 text-[13px]">Sử dụng ứng dụng Authenticator để quét mã</p>
                      </div>
                      <div className="flex items-center justify-center rounded-xl p-4" style={{ background: "#fff" }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl ?? "")}`}
                          alt="QR Code"
                          className="h-44 w-44"
                        />
                      </div>
                      <div className="flex w-full gap-2">
                        <input
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Nhập mã OTP"
                          maxLength={6}
                          autoFocus
                          className="rounded-btn text-text-primary placeholder:text-text-tertiary flex-1 border px-3.5 text-center text-[13px] text-[18px] tracking-[6px] outline-none"
                          style={{
                            height: "44px",
                            borderColor: otpError ? "#F05252" : "rgba(255,255,255,0.12)",
                            background: "#3A4352",
                          }}
                        />
                      </div>
                      {otpError && <span className="text-semantic-error -mt-2 text-[11px]">{otpError}</span>}
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpInput.length !== 6 || twoFALoading}
                        className="rounded-btn bg-brand-teal text-text-inverse flex h-11 w-full items-center justify-center gap-2 text-[13px] font-medium disabled:opacity-50"
                      >
                        {twoFALoading && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        Xác nhận
                      </button>
                    </div>
                  </Dialog>
                </div>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.12)" }} />
                <div className="pointer-events-none flex select-none flex-col gap-4 opacity-50">
                  <div className="flex items-center gap-2">
                    <h2 className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
                      Thông báo
                    </h2>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: "#3A4352", color: "#667180" }}
                    >
                      Sắp ra mắt
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary text-[13px] font-medium">Gửi email thông báo</span>
                    <Toggle checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary text-[13px] font-medium">Gửi SMS thông báo</span>
                    <Toggle checked={notifySMS} onChange={() => setNotifySMS(!notifySMS)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary text-[13px] font-medium">Thông báo qua ứng dụng</span>
                    <Toggle checked={notifyApp} onChange={() => setNotifyApp(!notifyApp)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-end gap-3 border-t px-6 py-4"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            <Button
              variant="secondary"
              onClick={() => navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any })}
            >
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button htmlType="submit" isLoading={saving}>
              <Save className="h-4 w-4" /> Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AddCompanyDialog({
  userId,
  open,
  onClose,
  queryClient,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  queryClient: any;
}) {
  const { data: allCompanies } = useQuery({
    queryKey: ["all-companies"],
    queryFn: fetchAllCompanies,
    staleTime: 60_000,
  });
  const { data: userCompanies } = useQuery({
    queryKey: ["user-companies", userId],
    queryFn: () => fetchUserCompanies(userId),
  });
  const [selectedId, setSelectedId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const userCompanyIds = new Set((userCompanies ?? []).map((c) => c.companyId));
  const available = (allCompanies ?? []).filter((c) => !userCompanyIds.has(c.id) && c.status === "active");

  const handleAdd = () => {
    if (!selectedId || addLoading) return;
    setAddLoading(true);
    addUserToCompany(userId, selectedId)
      .then(() => {
        onClose();
        queryClient.invalidateQueries({ queryKey: ["user-companies"] });
        queryClient.invalidateQueries({ queryKey: ["user", userId] });
      })
      .catch((e) => notification.error({ message: "Lỗi", description: e.message, placement: "bottomRight" }))
      .finally(() => setAddLoading(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-text-primary text-[15px] font-semibold" style={{ fontFamily: "Manrope" }}>
          Thêm công ty
        </p>
        <p className="text-text-tertiary text-[13px]">Chọn công ty để thêm người dùng vào.</p>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {available.length === 0 && (
            <p className="text-text-tertiary py-2 text-[13px]">Người dùng đã thuộc tất cả công ty.</p>
          )}
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="rounded-btn flex items-center gap-2 px-3 py-2 text-left transition-colors"
              style={{
                background: selectedId === c.id ? "rgba(0,199,165,0.14)" : "transparent",
                color: selectedId === c.id ? "#00C7A5" : "#F8FAFC",
              }}
            >
              <span className="text-[13px] font-medium">{c.name}</span>
              <span className="text-text-tertiary text-[11px]">{c.code}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn h-11 flex-1 border text-[13px] font-medium"
            style={{ borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedId || addLoading}
            className="rounded-btn bg-brand-teal text-text-inverse flex h-11 flex-1 items-center justify-center gap-2 text-[13px] font-medium disabled:opacity-50"
          >
            {addLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Thêm
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function UserCompaniesList({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: companies, isLoading } = useQuery({
    queryKey: ["user-companies", userId],
    queryFn: () => fetchUserCompanies(userId),
  });

  const handleRemove = async (companyId: string) => {
    try {
      await removeUserFromCompany(userId, companyId);
      queryClient.invalidateQueries({ queryKey: ["user-companies"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      notification.success({ message: "Đã xoá người dùng khỏi công ty", placement: "bottomRight" });
    } catch (e) {
      notification.error({ message: "Lỗi", description: (e as Error).message, placement: "bottomRight" });
      throw e;
    }
  };

  if (isLoading) return <div className="text-text-tertiary text-[13px]">Đang tải...</div>;
  if (!companies || companies.length === 0)
    return <div className="text-text-tertiary text-[13px]">Chưa thuộc công ty nào.</div>;

  return (
    <div className="flex flex-col gap-2">
      {companies.map((c) => (
        <div key={c.companyId} className="rounded-btn flex items-center gap-3 p-3" style={{ background: "#101B2B" }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: c.active ? "#00C7A5" : "#3A4352" }}
          >
            <span className="text-text-inverse text-[13px] font-bold">{c.companyName?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-text-primary truncate text-[13px] font-medium">{c.companyName}</span>
              <span className="text-text-disabled text-[11px]">{c.companyCode}</span>
              {c.defaultCompany && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px]"
                  style={{ background: "rgba(0,199,165,0.14)", color: "#00C7A5" }}
                >
                  Mặc định
                </span>
              )}
            </div>
            <span className="text-text-tertiary text-[11px]">{c.active ? "Đang hoạt động" : "Không hoạt động"}</span>
          </div>
          {!c.defaultCompany && (
            <Popconfirm
              title="Xoá người dùng khỏi công ty này?"
              onConfirm={() => handleRemove(c.companyId)}
              okText="Xoá"
              cancelText="Hủy"
              placement="left"
            >
              <button type="button" className="text-semantic-error shrink-0 text-[12px] hover:underline">
                <Trash2 className="inline h-3.5 w-3.5" /> Xoá
              </button>
            </Popconfirm>
          )}
        </div>
      ))}
    </div>
  );
}
