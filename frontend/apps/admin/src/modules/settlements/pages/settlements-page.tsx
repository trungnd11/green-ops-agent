import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, RotateCcw, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { DateRange } from "@xanh/ui/date-picker";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { useSettlementList } from "../api/settlement.queries";
import { formatCurrency } from "@xanh/utils";
import type { Settlement } from "../api/settlement.types";

const STATUS_VARIANT: Record<string, string> = {
  draft: "warning",
  pending: "warning",
  approved: "success",
  paid: "info",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã thanh toán",
};

export function SettlementsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const defaultRange = useMemo(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10) };
  }, []);
  const [dateRange, setDateRange] = useState(defaultRange);
  const queryClient = useQueryClient();

  const { data, isFetching } = useSettlementList(undefined, page);

  const items = (data?.items || []).filter((s: Settlement) => {
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (!s.settlementCode?.toLowerCase().includes(kw)) return false;
    }
    if (status !== "all" && s.status !== status) return false;
    return true;
  });

  const stats = items.reduce((acc, s: Settlement) => ({
    totalPayout: acc.totalPayout + (s.totalPayout || 0),
    paid: acc.paid + (s.status === "paid" ? (s.totalPayout || 0) : 0),
  }), { totalPayout: 0, paid: 0 });

  const handleSearch = useCallback(() => {
    setPage(0);
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  }, [queryClient]);

  const handleReset = useCallback(() => {
    setKeyword("");
    setStatus("all");
    setDateRange(defaultRange);
    setPage(0);
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  }, [defaultRange, queryClient]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Quyết toán
        </h1>
        <p className="text-text-secondary text-[13px]">Danh sách kỳ quyết toán</p>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={DollarSign} label="Tổng phải trả" value={formatCurrency(stats.totalPayout)} color="#F8FAFC" />
        <StatsCard icon={CheckCircle} label="Đã thanh toán" value={formatCurrency(stats.paid)} color="#22C55E" />
        <StatsCard icon={Clock} label="Số kỳ" value={items.length} color="#38BDF8" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Tìm kiếm</p>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mã quyết toán..."
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
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "paid", label: "Đã thanh toán" },
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

      <Table<Settlement>
        dataSource={items}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Mã", render: (_, r) => r.settlementCode },
          { title: "Tài xế", render: (_, r) => r.totalDrivers },
          { title: "Doanh thu", render: (_, r) => formatCurrency(r.totalRevenue) },
          { title: "Khấu trừ", render: (_, r) => formatCurrency(r.totalDeduction) },
          { title: "Cộng thêm", render: (_, r) => formatCurrency(r.totalAddition) },
          { title: "Thực trả", render: (_, r) => formatCurrency(r.totalPayout) },
          {
            title: "Trạng thái",
            render: (_, r) => (
              <Badge variant={(STATUS_VARIANT[r.status] || "default") as any}>
                {STATUS_LABEL[r.status] || r.status}
              </Badge>
            ),
          },
        ]}
        onRowClick={(r) => navigate({ to: `/settlements/${r.id}` } as any)}
        pagination={buildPagination(
          page,
          20,
          data?.totalElements ?? 0,
          (p: number) => setPage(p),
          () => {}
        )}
      />
    </div>
  );
}
