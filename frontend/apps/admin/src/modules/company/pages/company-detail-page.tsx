import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Building2, CalendarDays, Clock, Edit3 } from "lucide-react";
import { Button } from "@xanh/ui";
import { fetchCompany } from "../../admin/api/user.api";

const statusLabel: Record<string, string> = { active: "Đang hoạt động", inactive: "Vô hiệu hóa" };
const statusColor: Record<string, string> = { active: "#22C55E", inactive: "#8792A2" };

export function CompanyDetailPage() {
  const { companyId } = useParams({ from: "/_authenticated/admin/companies/$companyId" });
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-6 w-48 rounded" style={{ background: "#3A4352" }} />
        <div className="rounded-card border p-6" style={{ height: 140, borderColor: "rgba(255,255,255,0.12)" }} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-[16px] font-semibold text-text-primary">Không tìm thấy công ty</span>
        <Button variant="secondary" onClick={() => navigate({ to: "/admin/companies" } as any)}>Quay lại</Button>
      </div>
    );
  }

  const infoRows = [
    { label: "Mã công ty", value: company.code },
    { label: "Tên công ty", value: company.name },
    { label: "Địa chỉ", value: company.address || "—" },
    { label: "Số điện thoại", value: company.phone || "—" },
    { label: "Email", value: company.email || "—" },
    { label: "Mã số thuế", value: company.taxCode || "—" },
    { label: "Người đại diện", value: company.contactPerson || "—" },
    { label: "Trạng thái", value: statusLabel[company.status] || company.status },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-8 h-16 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <button className="flex items-center justify-center w-9 h-9 rounded-btn border" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#101B2B" }} onClick={() => navigate({ to: "/admin/companies" } as any)}>
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <span className="text-[13px] text-text-tertiary flex items-center gap-1.5">
          <span>Quản trị hệ thống</span>
          <ChevronRight className="h-3 w-3" />
          <span className="cursor-pointer hover:text-text-secondary" onClick={() => navigate({ to: "/admin/companies" } as any)}>Quản lý công ty</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-primary">Chi tiết công ty</span>
        </span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-2 rounded-btn px-5 text-[14px] font-semibold"
          style={{ height: "40px", background: "#00C7A5", color: "#F8FAFC" }}
          onClick={() => navigate({ to: `/admin/companies/${companyId}/edit` } as any)}
        >
          <Edit3 className="h-4 w-4" /> Chỉnh sửa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {/* Header Card */}
        <div className="rounded-card border p-6 flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{ background: "#00AEEF" }}>
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: "Manrope" }}>{company.name}</h1>
              <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: `${statusColor[company.status]}1a`, color: statusColor[company.status] }}>{statusLabel[company.status] || company.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[13px] text-text-secondary flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-text-disabled" />{company.createdAt ? new Date(company.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
              <span className="text-[12px] text-text-tertiary">|</span>
              <span className="text-[13px] text-text-secondary flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-text-disabled" /> Mã: {company.code}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="rounded-card border p-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}>
          <h3 className="text-[15px] font-semibold text-text-primary mb-4" style={{ fontFamily: "Manrope" }}>Thông tin công ty</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {infoRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="text-[12px] text-text-tertiary">{row.label}</span>
                <span className="text-[13px] text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
