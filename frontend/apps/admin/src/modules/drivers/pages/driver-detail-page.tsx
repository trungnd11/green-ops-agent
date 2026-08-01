import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, User, Phone, CreditCard, Calendar, MapPin, BadgeCheck, Car, Edit3 } from "lucide-react";
import { Button } from "@xanh/ui";
import { fetchDriver } from "../api/driver.api";

const statusLabel: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Ngưng",
  blocked: "Khóa",
  pending_verification: "Chờ xác minh",
};

const statusColor: Record<string, string> = {
  active: "#22C55E",
  inactive: "#8792A2",
  blocked: "#F05252",
  pending_verification: "#F59E0B",
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0" style={{ color: "#8792A2" }} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-medium tracking-wide" style={{ color: "#8792A2" }}>{label}</span>
        <span className="text-[13px] font-medium" style={{ color: "#F8FAFC" }}>{value}</span>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
      <h3 className="text-[15px] font-semibold mb-4" style={{ fontFamily: "Manrope", color: "#F8FAFC" }}>{title}</h3>
      {children}
    </div>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function DriverDetailPage() {
  const { driverId } = useParams({ from: "/_authenticated/drivers/$driverId" });
  const navigate = useNavigate();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => fetchDriver(driverId),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-6 w-48 rounded" style={{ background: "#3A4352" }} />
        <div className="rounded-card border p-6" style={{ height: 140, borderColor: "rgba(255,255,255,0.12)" }} />
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-card border p-6" style={{ height: 260, borderColor: "rgba(255,255,255,0.12)" }} />
          <div className="rounded-card border p-6" style={{ height: 260, borderColor: "rgba(255,255,255,0.12)" }} />
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-[16px] font-semibold" style={{ color: "#F8FAFC" }}>Không tìm thấy tài xế</span>
        <Button variant="secondary" onClick={() => navigate({ to: "/drivers" } as any)}>
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
          onClick={() => navigate({ to: "/drivers" } as any)}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: "#8792A2" }} />
        </button>
        <span className="text-[13px]" style={{ color: "#8792A2" }}>
          <span className="flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-text-secondary" onClick={() => navigate({ to: "/drivers" } as any)}>
              Danh sách tài xế
            </span>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: "#F8FAFC" }}>Chi tiết tài xế</span>
          </span>
        </span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-2 rounded-btn px-5 text-[14px] font-semibold"
          style={{ height: "40px", background: "#00C7A5", color: "#F8FAFC" }}
          onClick={() => navigate({ to: `/drivers/${driverId}/edit` } as any)}
        >
          <Edit3 className="h-4 w-4" /> Chỉnh sửa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="rounded-card border p-5 shrink-0 self-start w-full lg:w-64" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
            <div className="flex flex-col items-center text-center gap-2.5">
              <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "#101B2B" }}>
                <span className="text-xl font-bold" style={{ color: "#8792A2" }}>
                  {driver.fullName?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-base font-bold" style={{ fontFamily: "Manrope", color: "#F8FAFC" }}>{driver.fullName}</h1>
                <span className="text-[12px]" style={{ color: "#8792A2" }}>{driver.driverCode}</span>
                <div className="flex justify-center">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: `${statusColor[driver.status]}1a`, color: statusColor[driver.status] }}>
                    {statusLabel[driver.status] || driver.status}
                  </span>
                </div>
              </div>
              {driver.phone && <span className="text-[12px]" style={{ color: "#8792A2" }}>{driver.phone}</span>}
              {driver.email && <span className="text-[12px]" style={{ color: "#8792A2" }}>{driver.email}</span>}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DetailCard title="Thông tin cá nhân">
              <div className="flex flex-col gap-1">
                <InfoRow icon={User} label="Họ và tên" value={driver.fullName} />
                <InfoRow icon={Phone} label="Số điện thoại" value={driver.phone || "—"} />
                <InfoRow icon={CreditCard} label="CCCD" value={driver.cccd || "—"} />
                <InfoRow icon={Calendar} label="Ngày sinh" value={formatDate(driver.birthDate)} />
                <InfoRow icon={User} label="Giới tính" value={driver.gender ? (driver.gender === "male" ? "Nam" : driver.gender === "female" ? "Nữ" : "Khác") : "—"} />
              </div>
            </DetailCard>

            <DetailCard title="Thông tin tài xế">
              <div className="flex flex-col gap-1">
                <InfoRow icon={Car} label="Mã LX" value={driver.driverCode} />
                <InfoRow icon={BadgeCheck} label="Trạng thái" value={statusLabel[driver.status] || driver.status} />
                <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(driver.joinDate)} />
                <InfoRow icon={MapPin} label="Địa chỉ" value={driver.address || "—"} />
                <InfoRow icon={CreditCard} label="Tiền cọc" value={driver.depositAmount ? `${driver.depositAmount.toLocaleString("vi-VN")}đ` : "0đ"} />
                <InfoRow icon={User} label="User giới thiệu" value={driver.referrerName || "—"} />
              </div>
            </DetailCard>
          </div>
        </div>
      </div>
    </div>
  );
}
