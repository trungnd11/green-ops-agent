import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchProfile } from "../api/profile.api";
import { formatCurrency } from "@xanh/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: fetchProfile,
  });

  if (isLoading) return (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="avatar" />
      <Skeleton variant="card" />
    </div>
  );

  const info = [
    { label: "Số điện thoại", value: profile?.phone || "—" },
    { label: "Email", value: profile?.email || "—" },
    { label: "CCCD", value: profile?.cccd || "—" },
    { label: "Ngày sinh", value: profile?.birthDate || "—" },
    { label: "Địa chỉ", value: profile?.address || "—" },
    { label: "Số GPLX", value: profile?.licenseNumber || "—" },
    { label: "Hạng GPLX", value: profile?.licenseClass || "—" },
    { label: "Ngày tham gia", value: profile?.joinDate || "—" },
    { label: "Tiền cọc", value: profile?.depositAmount ? formatCurrency(profile.depositAmount) : "—" },
  ];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-text-primary">Hồ sơ</h1>

      <div className="flex flex-col items-center gap-3 rounded-card border border-border-default bg-surface-card p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
          <span className="text-xl font-bold text-text-secondary">
            {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold text-text-primary">{profile?.fullName || "..."}</h2>
          <p className="text-xs text-text-tertiary">{profile?.driverCode || ""}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-lg font-bold text-brand-teal">{formatCurrency(profile?.availableBalance || 0)}</p>
            <p className="text-xs text-text-secondary">Số dư</p>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(profile?.totalBalance || 0)}</p>
            <p className="text-xs text-text-secondary">Tổng</p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border-default bg-surface-card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Thông tin cá nhân</h3>
        <div className="space-y-3">
          {info.map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-text-secondary">{row.label}</span>
              <span className="text-text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
