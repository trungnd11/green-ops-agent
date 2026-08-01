import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, RotateCcw, Upload, Database, Lock, Unlock, DollarSign } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { DateRange } from "@xanh/ui/date-picker";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { fetchPeriods } from "../api/revenue.api";
import type { RevenuePeriod } from "../api/revenue.types";
import { formatCurrency } from "@xanh/utils";

const STATUS_VARIANT: Record<string, string> = {
  draft: "warning",
  imported: "info",
  verified: "success",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  imported: "Đã import",
  verified: "Đã xác thực",
  closed: "Đã đóng",
};

export function RevenueListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const defaultRange = useMemo(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) };
  }, []);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [searchKey, setSearchKey] = useState(0);

  const { data, isFetching } = useQuery({
    queryKey: ["revenue", "periods", page, keyword, status, dateRange, searchKey],
    queryFn: () => {
      const params: Record<string, unknown> = { page };
      if (keyword) params.keyword = keyword;
      if (status !== "all") params.status = status;
      return fetchPeriods(params as any);
    },
  });

  const items = (data?.items || []).filter((i: RevenuePeriod) => {
    if (!i.startDate) return true;
    const d = i.startDate.slice(0, 10);
    return d >= dateRange.from && d <= dateRange.to;
  });
  const total = items.length;
  const totalRevenue = items.reduce((s: number, i: RevenuePeriod) => s + (i.totalRevenue || 0), 0);

  const handleSearch = useCallback(() => {
    setSearchKey(k => k + 1);
    setPage(0);
  }, []);

  const handleReset = useCallback(() => {
    setKeyword("");
    setStatus("all");
    setDateRange(defaultRange);
    setSearchKey(k => k + 1);
    setPage(0);
  }, [defaultRange]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Danh sách kỳ doanh thu
          </h1>
          <p className="text-text-secondary text-[13px]">Quản lý các kỳ doanh thu</p>
        </div>
        <Button variant="secondary" onClick={() => navigate({ to: "/revenues/import" } as any)}>
          <Upload className="h-4 w-4" /> Import Excel
        </Button>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Database} label="Tổng kỳ" value={total} color="#F8FAFC" />
        <StatsCard icon={Unlock} label="Đang mở" value={items.filter((i: RevenuePeriod) => i.status === "draft" || i.status === "imported").length} color="#F59E0B" />
        <StatsCard icon={Lock} label="Đã khóa" value={items.filter((i: RevenuePeriod) => i.status === "verified").length} color="#22C55E" />
        <StatsCard icon={DollarSign} label="Tổng doanh thu" value={formatCurrency(totalRevenue)} color="#00C7A5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Tìm kiếm</p>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên kỳ doanh thu..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-1">Thời gian</p>
          <DateRange
            value={dateRange as any}
            onChange={(val: any) => {
              if (val?.from && val?.to) setDateRange({ from: val.from, to: val.to });
            }}
          />
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-1">Trạng thái</p>
          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "draft", label: "Nháp" },
              { value: "imported", label: "Đã import" },
              { value: "verified", label: "Đã xác thực" },
              { value: "closed", label: "Đã đóng" },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" leftIcon={<Search className="h-4 w-4" />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button variant="secondary" className="text-text-tertiary" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      </div>

      <Table<RevenuePeriod>
        dataSource={items}
          isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Kỳ doanh thu", render: (_, r) => r.name },
          { title: "Thời gian", render: (_, r) => r.startDate && r.endDate ? `${r.startDate.slice(0, 10)} - ${r.endDate.slice(0, 10)}` : "—" },
          { title: "Tài xế", render: (_, r) => r.driverCount ?? "—" },
          { title: "Doanh thu", render: (_, r) => formatCurrency(r.totalRevenue || 0) },
          {
            title: "Trạng thái",
            render: (_, r) => (
              <Badge variant={(STATUS_VARIANT[r.status] || "default") as any}>
                {STATUS_LABEL[r.status] || r.status}
              </Badge>
            ),
          },
        ]}
        onRowClick={(r) => navigate({ to: `/revenues/${r.id}` } as any)}
        pagination={buildPagination(
          page,
          20,
          total,
          (p: number) => setPage(p),
          () => {}
        )}
      />
    </div>
  );
}
