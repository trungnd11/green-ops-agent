import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Settings, Edit3, Users, Search, ChevronDown, Plus, MoreHorizontal, RotateCcw } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Button } from "@xanh/ui/button";
import { Select } from "@xanh/ui/select";
import { Table } from "@xanh/ui/table";
import { buildPagination } from "@/shared/utils/pagination";
import { roleQueries } from "../api/role.queries";
import type { RoleResponse } from "../api/role.api";

const statusLabel: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Vô hiệu hóa",
};

const statusColor: Record<string, string> = {
  ACTIVE: "#22C55E",
  INACTIVE: "#8792A2",
};

export function RoleListPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/admin/roles" });
  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? 10;
  const keyword = search.keyword ?? "";

  const updateSearch = (params: Record<string, unknown>) => {
    navigate({ to: "/admin/roles", search: { ...search, ...params, page: params.page ?? page } as any, replace: true });
  };

  const { data, isLoading } = useQuery(roleQueries.list({ page, size: pageSize, ...(keyword ? { keyword } : {}) }));

  const columns = [
    {
      title: "Vai trò",
      key: "name",
      width: 220,
      render: (_: unknown, record: RoleResponse) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-text-primary text-[13px] font-medium">{record.name}</span>
          <span className="text-text-tertiary text-[11px]">{record.code}</span>
        </div>
      ),
    },
    {
      title: "Loại",
      key: "scope",
      width: 100,
      render: () => (
        <span
          className="inline-flex items-center rounded-full px-2.5 text-[11px] font-medium"
          style={{ height: "22px", background: "#101B2B", color: "#00AEEF" }}
        >
          Công ty
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (text: string) => (
        <span className="text-[13px]" style={{ color: statusColor[text] || "#8792A2" }}>
          {statusLabel[text] || text}
        </span>
      ),
    },
    {
      title: "Cập nhật gần nhất",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (text: string) => (
        <span className="text-text-tertiary text-[13px]">
          {text ? new Date(text).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_: unknown, record: RoleResponse) => (
        <button
          className="text-text-tertiary hover:text-text-secondary p-1 transition-colors"
          onClick={() => navigate({ to: `/admin/roles/${record.id}` })}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Quản lý vai trò
        </h1>
        <p className="text-text-secondary text-[13px]">
          Tạo và quản lý nhóm quyền, phân quyền cho người dùng trong công ty.
        </p>
      </div>

      <div className="flex gap-4">
        {[
          { icon: Shield, label: "Tổng số vai trò", value: data?.totalElements ?? 0, color: "#00C7A5" },
          { icon: Settings, label: "Vai trò hệ thống", value: "—", color: "#00AEEF" },
          { icon: Edit3, label: "Vai trò tùy chỉnh", value: "—", color: "#A78BFA" },
          { icon: Users, label: "Vai trò đang dùng", value: "—", color: "#22C55E" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-card flex flex-1 flex-col gap-1 border p-4"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
          >
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
              <span className="text-text-secondary text-[13px]">{card.label}</span>
            </div>
            <span className="text-2xl font-bold leading-none" style={{ fontFamily: "Manrope", color: card.color }}>
              {typeof card.value === "number" ? card.value.toLocaleString("vi-VN") : card.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Input
          value={keyword}
          onChange={(e) => updateSearch({ keyword: e.target.value, page: 0 })}
          placeholder="Tìm kiếm theo tên hoặc mã vai trò..."
          leftIcon={<Search className="h-4 w-4 text-text-tertiary" />}
          className="!h-11 w-[320px]"
        />
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => updateSearch({ keyword: "", page: 0 })}>
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </Button>
        <Button onClick={() => navigate({ to: "/admin/roles/create" })}>
          <Plus className="h-4 w-4" /> Tạo vai trò
        </Button>
      </div>

      <Table<RoleResponse>
        columns={columns}
        dataSource={data?.items ?? []}
        isLoading={isLoading}
        rowKey="id"
        onRowClick={(record: RoleResponse) => navigate({ to: `/admin/roles/${record.id}` })}
        pagination={buildPagination(page, pageSize, data?.totalElements ?? 0, (p) => updateSearch({ page: p }), (size) => updateSearch({ pageSize: size, page: 0 }))}
      />
    </div>
  );
}
