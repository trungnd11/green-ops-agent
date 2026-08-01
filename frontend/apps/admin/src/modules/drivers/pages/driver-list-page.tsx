import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@xanh/utils";
import { Users, CheckCircle, Lock, RotateCcw, Plus } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Select } from "@xanh/ui/select";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { SearchInput } from "@/shared/components/SearchInput";
import { useDriverListQuery, useDriverStatsQuery } from "../hooks/query/useDriverListQuery";
import { useDriverTable } from "../hooks/table/useDriverTable";
import type { DriverResponse } from "../api/driver.types";

export function DriverListPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/drivers" });
  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? 20;
  const keyword = search.keyword ?? "";
  const statusFilter = search.status ?? "all";

  const updateSearch = (params: Record<string, unknown>) => {
    navigate({
      to: "/drivers",
      search: { ...search, ...params, page: params.page ?? page } as any,
      replace: true,
    });
  };

  const { data, isLoading } = useDriverListQuery(page, pageSize, keyword, statusFilter);
  const { data: stats } = useDriverStatsQuery();
  const { columns } = useDriverTable(page);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Danh sách tài xế
          </h1>
          <p className="text-text-secondary text-[13px]">Quản lý danh sách tài xế thuộc công ty.</p>
        </div>
        <button
          className={cn(
            "rounded-btn flex items-center justify-center",
            "bg-brand-teal text-text-inverse gap-1.5 text-[13px] font-medium"
          )}
          style={{ height: "44px", padding: "0 20px" }}
          onClick={() => navigate({ to: "/drivers/add" } as any)}
        >
          <Plus className="h-4 w-4" />
          Thêm tài xế
        </button>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Users} label="Tổng tài xế" value={data?.totalElements ?? "..."} color="#F8FAFC" />
        <StatsCard icon={CheckCircle} label="Đang hoạt động" value={stats?.active ?? "..."} color="#00C7A5" />
        <StatsCard icon={Lock} label="Ngưng / Khóa" value={(stats?.inactive ?? 0) + (stats?.blocked ?? 0)} color="#F05252" />
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={keyword}
          onChange={(v) => updateSearch({ keyword: v, page: 0 })}
          placeholder="Tìm kiếm mã LX, tên tài xế..."
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            updateSearch({ status: v, page: 0 });
          }}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Ngưng" },
            { value: "blocked", label: "Khóa" },
            { value: "pending_verification", label: "Chờ xác minh" },
          ]}
          placeholder="Trạng thái"
          className="!w-35"
        />
        <Button
          variant="secondary"
          className="text-text-tertiary hover:text-text-secondary"
          onClick={() => {
            navigate({ to: "/drivers", search: { page: 0, keyword: "", status: "all" } as any, replace: true });
          }}
        >
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </Button>
      </div>

      <Table<DriverResponse>
        columns={columns}
        dataSource={data?.items ?? []}
        isLoading={isLoading}
        rowKey="id"
        autoHeight
        onRowClick={(record: DriverResponse) => navigate({ to: `/drivers/${record.id}` })}
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
