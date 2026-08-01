import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, UserPlus, Search } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { notification } from "@xanh/ui/notification";
import { FormField } from "../../../shared/components/FormField";
import { createDriver } from "../api/driver.api";
import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, PageResponse } from "../../../shared/api/api.types";

const tabs = ["Thông tin tài khoản", "Thông tin cá nhân", "Cấu hình"];

const statusOptions = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngưng" },
  { value: "blocked", label: "Khóa" },
];

const genderOptions = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export function DriverAddPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vals, setVals] = useState({
    driverCode: "",
    fullName: "",
    phone: "",
    email: "",
    cccd: "",
    birthDate: "",
    gender: "male",
    address: "",
    licenseNumber: "",
    licenseClass: "",
    joinDate: "",
    status: "active",
    depositAmount: "",
    note: "",
    referrerId: "",
  });

  const [users, setUsers] = useState<{ id: string; fullName: string; username: string }[]>([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params: Record<string, unknown> = { page: 0, size: 50 };
        if (userSearch) params.keyword = userSearch;
        const res = await httpClient.get<ApiResponse<PageResponse<{ id: string; fullName: string; username: string }>>>("/users", params);
        if (res.success && res.data) {
          setUsers(res.data.items);
        }
      } catch {
        // ignore
      }
    };
    fetchUsers();
  }, [userSearch]);

  const v = (name: string) => vals[name as keyof typeof vals] ?? "";
  const sv = (name: string, val: string) => {
    setVals((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vals.driverCode.trim()) errs.driverCode = "Vui lòng nhập mã LX";
    if (!vals.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!vals.joinDate.trim()) errs.joinDate = "Vui lòng nhập ngày tham gia";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        driverCode: vals.driverCode.trim(),
        fullName: vals.fullName.trim(),
        phone: vals.phone.trim() || undefined,
        email: vals.email.trim() || undefined,
        cccd: vals.cccd.trim() || undefined,
        gender: vals.gender || undefined,
        address: vals.address.trim() || undefined,
        licenseNumber: vals.licenseNumber.trim() || undefined,
        licenseClass: vals.licenseClass.trim() || undefined,
        status: vals.status,
        depositAmount: vals.depositAmount ? Number(vals.depositAmount.replace(/[^0-9]/g, "")) : undefined,
        note: vals.note.trim() || undefined,
      };
      if (vals.birthDate) payload.birthDate = vals.birthDate;
      if (vals.joinDate) payload.joinDate = vals.joinDate;
      if (vals.referrerId) payload.referrerId = vals.referrerId;

      await createDriver(payload);
      notification.success({ message: "Thêm tài xế thành công", placement: "bottomRight" });
      navigate({ to: "/drivers" } as any);
    } catch (err: any) {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-160">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
            Thêm tài xế mới
          </h1>
          <p className="text-[13px] text-text-tertiary">Nhập thông tin để thêm tài xế mới vào hệ thống.</p>
        </div>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-btn bg-bg-subtle"
          onClick={() => navigate({ to: "/drivers" } as any)}
        >
          <X className="h-4.5 w-4.5 text-text-secondary" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
              <FormField label="Mã LX" required error={errors.driverCode || ""}>
                <Input
                  value={v("driverCode")}
                  onChange={(e: any) => sv("driverCode", e.target.value)}
                  placeholder="VD: GSMTYMUI999"
                  hasError={!!errors.driverCode}
                />
              </FormField>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-text-secondary">
                  Họ và tên <span className="text-semantic-error">*</span>
                </span>
                <Input
                  value={v("fullName")}
                  onChange={(e: any) => sv("fullName", e.target.value)}
                  placeholder="Nhập họ tên..."
                  hasError={!!errors.fullName}
                />
                {errors.fullName && (
                  <span className="text-[11px] text-semantic-error leading-none">{errors.fullName}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4" style={{ display: tab === 1 ? "flex" : "none" }}>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
                Thông tin cá nhân
              </h2>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Số điện thoại</span>
                  <Input
                    value={v("phone")}
                    onChange={(e: any) => sv("phone", e.target.value)}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Email</span>
                  <Input
                    value={v("email")}
                    onChange={(e: any) => sv("email", e.target.value)}
                    placeholder="Nhập email..."
                  />
                </div>
              </div>
              <FormField label="Số CCCD">
                <Input
                  value={v("cccd")}
                  onChange={(e: any) => sv("cccd", e.target.value)}
                  placeholder="Nhập số CCCD..."
                />
              </FormField>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Ngày sinh</span>
                  <Input
                    value={v("birthDate")}
                    onChange={(e: any) => sv("birthDate", e.target.value)}
                    placeholder="yyyy-MM-dd"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Giới tính</span>
                  <Select
                    value={v("gender")}
                    onValueChange={(val: string) => sv("gender", val)}
                    options={genderOptions}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Số GPLX</span>
                  <Input
                    value={v("licenseNumber")}
                    onChange={(e: any) => sv("licenseNumber", e.target.value)}
                    placeholder="Số bằng lái..."
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-text-secondary">Hạng GPLX</span>
                  <Input
                    value={v("licenseClass")}
                    onChange={(e: any) => sv("licenseClass", e.target.value)}
                    placeholder="VD: B1, B2, C..."
                  />
                </div>
              </div>
              <FormField label="Địa chỉ">
                <Input
                  value={v("address")}
                  onChange={(e: any) => sv("address", e.target.value)}
                  placeholder="Nhập địa chỉ..."
                />
              </FormField>
            </div>

            <div className="flex flex-col gap-4" style={{ display: tab === 2 ? "flex" : "none" }}>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
                Cấu hình
              </h2>
              <FormField label="Trạng thái">
                <Select
                  value={v("status")}
                  onValueChange={(val: string) => sv("status", val)}
                  options={statusOptions}
                />
              </FormField>
              <FormField label="Ngày tham gia" required error={errors.joinDate || ""}>
                <Input
                  value={v("joinDate")}
                  onChange={(e: any) => sv("joinDate", e.target.value)}
                  placeholder="yyyy-MM-dd"
                  hasError={!!errors.joinDate}
                />
              </FormField>
              <FormField label="User giới thiệu">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    className="w-full rounded-btn border pl-9 pr-4 py-2 text-[14px] text-text-primary outline-none placeholder:text-text-disabled"
                    style={{ borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }}
                    placeholder="Tìm kiếm user..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {users.length === 0 ? (
                    <span className="text-xs text-text-tertiary">Không có user</span>
                  ) : users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`px-3 py-1 rounded-badge text-xs font-medium transition-colors ${
                        vals.referrerId === u.id
                          ? "bg-brand-teal text-text-inverse"
                          : "bg-bg-subtle text-text-secondary hover:text-text-primary"
                      }`}
                      onClick={() => sv("referrerId", vals.referrerId === u.id ? "" : u.id)}
                    >
                      {u.fullName} ({u.username})
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Tiền cọc (VNĐ)">
                <Input
                  value={v("depositAmount")}
                  onChange={(e: any) => sv("depositAmount", e.target.value)}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Ghi chú">
                <textarea
                  className="w-full rounded-btn border px-4 py-3 text-[14px] text-text-primary outline-none resize-none placeholder:text-text-disabled"
                  style={{ height: "80px", borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }}
                  placeholder="Nhập ghi chú..."
                  value={v("note")}
                  onChange={(e) => sv("note", e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            <Button variant="secondary" onClick={() => navigate({ to: "/drivers" } as any)}>
              <X className="h-4 w-4" /> Hủy
            </Button>
            <Button htmlType="submit" isLoading={saving}>
              <UserPlus className="h-4 w-4" /> Thêm tài xế
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
