import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, CalendarDays, Ellipsis } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Table } from "@xanh/ui/table";
import { buildPagination } from "@/shared/utils/pagination";
import { fetchAllCompanies, type BasicCompany } from "../../admin/api/user.api";
import { COMPANY_ROUTES } from "../../admin/constants/paths/admin";

export function CompanyListPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/admin/companies" });
  const page = search.page ?? 0;
  const keyword = search.keyword ?? "";

  const updateSearch = (params: Record<string, unknown>) => {
    navigate({ to: COMPANY_ROUTES.LIST, search: { ...search, ...params, page: params.page ?? page } as any, replace: true });
  };

  const { data: companies, isLoading } = useQuery({
    queryKey: ["all-companies"],
    queryFn: fetchAllCompanies,
    staleTime: 60_000,
  });

  const filtered = (companies ?? []).filter(
    (c) =>
      !keyword ||
      c.name.toLowerCase().includes(keyword.toLowerCase()) ||
      c.code.toLowerCase().includes(keyword.toLowerCase())
  );

  const columns = [
    {
      title: "Công ty",
      key: "name",
      width: 260,
      render: (_: unknown, record: BasicCompany) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "#00AEEF" }}>
            <span className="text-text-inverse text-[14px] font-bold">{record.name?.charAt(0).toUpperCase() ?? "?"}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-text-primary truncate text-[13px] font-medium">{record.name}</span>
            <span className="text-text-tertiary truncate text-[11px]">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Mã công ty",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (text: string) => <span className="text-text-secondary text-[13px]">{text}</span>,
    },
    {
      title: "Người dùng",
      key: "userCount",
      width: 100,
      render: () => (
        <span className="text-text-secondary text-[13px] flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-text-disabled" /> —</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (text: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium" style={{ background: text === "active" ? "rgba(34,197,94,0.15)" : "rgba(135,146,162,0.15)", color: text === "active" ? "#22C55E" : "#8792A2" }}>
          {text === "active" ? "Đang hoạt động" : "Không hoạt động"}
        </span>
      ),
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      width: 160,
      render: (_: unknown, record: BasicCompany) => (
        <span className="text-text-tertiary text-[12px] flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{record.createdAt ? new Date(record.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: () => (
        <button className="text-text-tertiary hover:text-text-secondary p-1 transition-colors"><Ellipsis className="h-4 w-4" /></button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>Quản lý công ty</h1>
          <p className="text-text-secondary text-[13px]">Quản lý thông tin các công ty đang sử dụng hệ thống.</p>
        </div>
        <button className="rounded-btn bg-brand-teal flex items-center justify-center gap-1.5 text-[14px] font-semibold text-white" style={{ height: "44px", padding: "0 24px" }} onClick={() => navigate({ to: COMPANY_ROUTES.ADD } as any)}>
          <Plus className="h-4 w-4" /> Thêm công ty
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          value={keyword}
          onChange={(e) => updateSearch({ keyword: e.target.value, page: 0 })}
          placeholder="Tìm kiếm công ty..."
          leftIcon={<Search className="h-4 w-4 text-text-tertiary" />}
          className="!h-11 w-[320px]"
        />
      </div>

      <Table<BasicCompany>
        columns={columns}
        dataSource={filtered}
        isLoading={isLoading}
        rowKey="id"
        onRowClick={(record: BasicCompany) => navigate({ to: COMPANY_ROUTES.DETAIL(record.id) } as any)}
        pagination={buildPagination(page, 10, filtered.length, (p) => updateSearch({ page: p }), () => {})}
      />
    </div>
  );
}
