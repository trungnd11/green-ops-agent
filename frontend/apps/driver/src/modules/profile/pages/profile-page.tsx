import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@xanh/ui/skeleton";
import { LogOut } from "lucide-react";
import { fetchProfile } from "../api/profile.api";
import { formatCurrency } from "@xanh/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
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

  const logout = () => {
    localStorage.removeItem("xanhsm-driver-auth");
    qc.clear();
    navigate({ to: "/login" } as never);
  };

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Hồ sơ</h1>
      </div>

      <div className="card glass" data-od-id="profile-head">
        <div className="profile-head">
          <div className="profile-avatar">
            {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h2 className="h1" style={{ fontSize: 22 }}>{profile?.fullName || "..."}</h2>
          <p className="muted" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.04em" }}>{profile?.driverCode || ""}</p>
          <div className="stat-grid" style={{ width: "100%", marginTop: 16 }}>
            <div className="stat glass-soft">
              <p className="stat-label">Số dư</p>
              <p className="stat-value num">{formatCurrency(profile?.availableBalance || 0)}</p>
            </div>
            <div className="stat glass-soft">
              <p className="stat-label">Tổng số dư</p>
              <p className="stat-value num">{formatCurrency(profile?.totalBalance || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card glass" data-od-id="profile-info">
        <h3 className="section-title" style={{ marginBottom: 6 }}>Thông tin cá nhân</h3>
        <dl style={{ marginTop: 8 }}>
          {info.map((row) => (
            <div key={row.label} className="info-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card glass" style={{ padding: 8 }}>
        <button type="button" className="drawer-item danger" onClick={logout}>
          <LogOut size={19} strokeWidth={1.8} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
