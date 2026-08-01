import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@xanh/utils";
import { Plus, Download, Users, CheckCircle, Lock, RotateCcw } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Select } from "@xanh/ui/select";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { SearchInput } from "@/shared/components/SearchInput";
import { ADMIN_ROUTES } from "../constants";
import { useUserListQuery } from "../hooks/query/useUserListQuery";
import { useUserStatsQuery } from "../hooks/query/useUserStatsQuery";
import { useUserTable } from "../hooks/table/useUserTable";
import type { UserResponse } from "../api/user.types";

export function AdminPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/admin" });
  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? 10;
  const keyword = search.keyword ?? "";
  const statusFilter = search.status ?? "";

  const updateSearch = (params: Record<string, unknown>) => {
    navigate({
      to: ADMIN_ROUTES.LIST,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: { ...search, ...params, page: params.page ?? page } as any,
      replace: true,
    });
  };

  const { data, isLoading } = useUserListQuery(page, pageSize, keyword, statusFilter);
  const { data: stats } = useUserStatsQuery();
  const { columns } = useUserTable(page);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Quản lý người dùng
          </h1>
          <p className="text-text-secondary text-[13px]">Quản lý thành viên, phân quyền truy cập hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={cn(
              "rounded-btn flex items-center justify-center",
              "gap-1.5 border text-[13px] font-medium",
              "cursor-not-allowed opacity-50"
            )}
            style={{ height: "44px", padding: "0 20px", borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
            disabled
          >
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </button>
          <button
            className={cn(
              "rounded-btn flex items-center justify-center",
              "bg-brand-teal text-text-inverse gap-1.5 text-[13px] font-medium"
            )}
            style={{ height: "44px", padding: "0 20px" }}
            onClick={() => navigate({ to: "/admin/users/add" })}
          >
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Users} label="Tổng người dùng" value={data?.totalElements ?? "..."} color="#F8FAFC" />
        <StatsCard icon={CheckCircle} label="Đang hoạt động" value={stats?.active ?? "..."} color="#00C7A5" />
        <StatsCard icon={Lock} label="Đã khóa / Ngừng" value={stats?.inactive ?? "..."} color="#F05252" />
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={keyword}
          onChange={(v) => updateSearch({ keyword: v, page: 0 })}
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            updateSearch({ status: v, page: 0 });
          }}
          options={[
            { value: "", label: "Tất cả" },
            { value: "active", label: "Đang hoạt động" },
            { value: "inactive", label: "Vô hiệu hóa" },
          ]}
          placeholder="Trạng thái"
          className="!w-35"
        />
        <Button
          variant="secondary"
          className="text-text-tertiary hover:text-text-secondary"
          onClick={() => {
            navigate({ to: ADMIN_ROUTES.LIST, search: { page: 0, keyword: "", status: "" } as any, replace: true });
          }}
        >
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </Button>
      </div>

      <Table<UserResponse>
        columns={columns}
        dataSource={data?.items ?? []}
        isLoading={isLoading}
        rowKey="id"
        autoHeight
        onRowClick={(record: UserResponse) => navigate({ to: `/admin/users/${record.id}` })}
        pagination={buildPagination(
          page,
          pageSize,
          data?.totalElements ?? 0,
          (p) => updateSearch({ page: p }),
          (size) => updateSearch({ pageSize: size, page: 0 })
        )}
      />
    </div>
  );
}
