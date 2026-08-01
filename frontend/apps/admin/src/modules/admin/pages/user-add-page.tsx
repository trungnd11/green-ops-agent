import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, UserPlus } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { FormField } from "../../../shared/components/FormField";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { Toggle } from "../../../shared/components/Toggle";
import { ComingSoon, ComingSoonBadge } from "../../../shared/components/ComingSoon";
import { fetchMyCompanies } from "../../company/api/company.api";
import { useUserAddForm } from "../hooks/form/useUserAddForm";
import { ADMIN_ROUTES } from "../constants";

const tabs = ["Thông tin tài khoản", "Thông tin cá nhân", "Cấu hình"];

export function UserAddPage() {
  const navigate = useNavigate();
  const { form, tab, setTab, handleEmailChange, serverError } = useUserAddForm();
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyApp, setNotifyApp] = useState(false);

  const { data: companyData } = useQuery({
    queryKey: ["my-companies"],
    queryFn: fetchMyCompanies,
    staleTime: 60_000,
    retry: false,
  });

  const companyOptions = (companyData ?? []).map((c) => ({ value: c.id, label: c.name }));

  useEffect(() => {
    if (companyData && companyData.length > 0) {
      const defaultC =
        companyData.find((c) => c.defaultCompany) ?? companyData[0];
      if (defaultC) form.setFieldValue("company", defaultC.id);
    }
  }, [companyData, form]);

  return (
    <div className="relative max-w-160 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
            Thêm người dùng mới
          </h1>
          <p className="text-[13px] text-text-tertiary">Nhập thông tin để tạo tài khoản người dùng mới</p>
        </div>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-btn bg-bg-subtle"
          onClick={() => navigate({ to: ADMIN_ROUTES.LIST } as any)}
        >
          <X className="h-4.5 w-4.5 text-text-secondary" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <div
          className="rounded-card border flex flex-col"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
        >
          <div
            className="flex items-center gap-1 p-1 mx-6 mt-5 rounded-badge"
            style={{ background: "#101B2B", width: "fit-content" }}
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                type="button"
                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  background: tab === i ? "#1C2737" : "transparent",
                  color: tab === i ? "#F8FAFC" : "#8792A2",
                }}
                onClick={() => setTab(i)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            <div className="flex flex-col gap-4" style={{ display: tab === 0 ? "flex" : "none" }}>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
                Thông tin tài khoản
              </h2>
              <form.Field name="username">
                {(f) => (
                  <FormField label="Tên đăng nhập" required error={String(f.state.meta.errors?.[0] ?? "")}>
                    <Input
                      value={f.state.value}
                      onChange={(e: any) => f.handleChange(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      hasError={!!f.state.meta.errors?.length}
                    />
                  </FormField>
                )}
              </form.Field>
              <form.Field name="company">
                {(f) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-text-secondary">Công ty</span>
                    <Select
                      value={f.state.value}
                      onValueChange={(v) => f.handleChange(v)}
                      options={companyOptions}
                      placeholder="Chọn công ty..."
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-4" style={{ display: tab === 1 ? "flex" : "none" }}>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
                Thông tin cá nhân
              </h2>
              <div className="flex gap-4">
                <form.Field name="firstName">
                  {(f) => (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[13px] font-medium text-text-secondary">
                        Họ <span className="text-semantic-error">*</span>
                      </span>
                      <Input
                        value={f.state.value}
                        onChange={(e) => f.handleChange(e.target.value)}
                        placeholder="Nhập họ..."
                        hasError={!!f.state.meta.errors.length}
                      />
                      {f.state.meta.errors.length > 0 && (
                        <span className="text-[11px] text-semantic-error leading-none">{f.state.meta.errors[0]}</span>
                      )}
                    </div>
                  )}
                </form.Field>
                <form.Field name="lastName">
                  {(f) => (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[13px] font-medium text-text-secondary">
                        Tên <span className="text-semantic-error">*</span>
                      </span>
                      <Input
                        value={f.state.value}
                        onChange={(e) => f.handleChange(e.target.value)}
                        placeholder="Nhập tên..."
                        hasError={!!f.state.meta.errors.length}
                      />
                      {f.state.meta.errors.length > 0 && (
                        <span className="text-[11px] text-semantic-error leading-none">{f.state.meta.errors[0]}</span>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
              <form.Field name="email">
                {(f) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-text-secondary">Email</span>
                    <Input
                      value={f.state.value}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="nhập địa chỉ email..."
                      hasError={!!f.state.meta.errors.length}
                    />
                    {f.state.meta.errors.length > 0 && (
                      <span className="text-[11px] text-semantic-error leading-none">{f.state.meta.errors[0]}</span>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="phone">
                {(f) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-text-secondary">Số điện thoại</span>
                    <Input
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      hasError={!!f.state.meta.errors.length}
                    />
                    {f.state.meta.errors.length > 0 && (
                      <span className="text-[11px] text-semantic-error leading-none">{f.state.meta.errors[0]}</span>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex flex-col gap-5" style={{ display: tab === 2 ? "flex" : "none" }}>
              <ComingSoon>
                <SectionHeader title="Thông báo" />
                <ComingSoonBadge />
              </ComingSoon>
              <div className="flex flex-col gap-4 opacity-50 pointer-events-none select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text-primary">Gửi email thông báo tạo tài khoản</span>
                  <Toggle checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text-primary">Gửi SMS thông báo</span>
                  <Toggle checked={notifySMS} onChange={() => setNotifySMS(!notifySMS)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text-primary">Thông báo qua ứng dụng</span>
                  <Toggle checked={notifyApp} onChange={() => setNotifyApp(!notifyApp)} />
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            {serverError && <p className="text-xs text-semantic-error mr-auto">{serverError}</p>}
            <Button variant="secondary" onClick={() => navigate({ to: ADMIN_ROUTES.LIST } as any)}>
              <X className="h-4 w-4" /> Hủy
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button htmlType="submit" isLoading={isSubmitting}>
                  <UserPlus className="h-4 w-4" /> Tạo người dùng
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
    </div>
  );
}
