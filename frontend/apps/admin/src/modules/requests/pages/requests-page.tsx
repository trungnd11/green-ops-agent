import { useState, useMemo, useCallback } from "react";
import { cn } from "@xanh/utils";
import { ArrowUpDown, ArrowDownUp, CheckCircle, XCircle, Clock, RotateCcw, Search } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Select } from "@xanh/ui/select";
import { DateRange } from "@xanh/ui/date-picker";
import { Input } from "@xanh/ui/input";
import { Dialog } from "@xanh/ui/dialog";
import { Badge } from "@xanh/ui/badge";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { useRequestList, useApproveRequest, useRejectRequest } from "../api/request.queries";
import { authStore } from "@/app/router";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import type { DriverTransaction } from "../api/request.types";

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const TABS = [
  { key: "topup", label: "Nạp tiền", icon: ArrowDownUp },
  { key: "withdraw", label: "Rút tiền", icon: ArrowUpDown },
];

const defaultRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
};

export function RequestsPage() {
  const [tab, setTab] = useState("topup");
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");
  const [dateRange, setDateRange] = useState(defaultRange);
  const [searchDateRange, setSearchDateRange] = useState(defaultRange);

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isFetching } = useRequestList(tab, searchStatus, page, searchKeyword || undefined, searchDateRange.from, searchDateRange.to);
  const approveMut = useApproveRequest();
  const rejectMut = useRejectRequest();

  const session = authStore.getSession();
  const adminId = session?.userId || "";
  const items = data?.items || [];

  const stats = useMemo(() => ({
    pending: items.filter((i: DriverTransaction) => i.status === "PENDING").length,
    approved: items.filter((i: DriverTransaction) => i.status === "APPROVED").length,
    rejected: items.filter((i: DriverTransaction) => i.status === "REJECTED").length,
  }), [items]);

  const handleSearch = useCallback(() => {
    setSearchKeyword(keyword);
    setSearchStatus(statusFilter);
    setSearchDateRange({ from: dateRange.from, to: dateRange.to });
    setPage(0);
  }, [keyword, statusFilter, dateRange]);

  const handleReset = useCallback(() => {
    setKeyword("");
    setStatusFilter("all");
    setDateRange(defaultRange());
    setSearchKeyword("");
    setSearchStatus("all");
    setSearchDateRange(defaultRange());
    setPage(0);
  }, []);

  const handleReject = () => {
    if (!rejectId) return;
    rejectMut.mutate({ id: rejectId, adminId, reason: rejectReason }, {
      onSuccess: () => { setRejectId(null); setRejectReason(""); },
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
            Nạp / Rút
          </h1>
          <p className="text-text-secondary text-[13px]">Quản lý yêu cầu nạp và rút tiền từ tài xế</p>
        </div>
        <div className="flex gap-1 p-1 rounded-badge bg-bg-subtle">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-surface-card text-text-primary' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Clock} label="Chờ duyệt" value={stats.pending} color="#F59E0B" />
        <StatsCard icon={CheckCircle} label="Đã duyệt" value={stats.approved} color="#00C7A5" />
        <StatsCard icon={XCircle} label="Đã từ chối" value={stats.rejected} color="#F05252" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Tìm kiếm</p>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên / mã tài xế"
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
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "PENDING", label: "Chờ duyệt" },
              { value: "APPROVED", label: "Đã duyệt" },
              { value: "REJECTED", label: "Đã từ chối" },
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

      <Table<DriverTransaction>
        dataSource={items}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Mã GD", render: (_, r) => r.transactionCode },
          { title: "Tài xế", render: (_, r) => `${r.driverCode || ""} ${r.driverName || ""}` },
          { title: "Số tiền", render: (_, r) => formatCurrency(Math.abs(r.amount)) },
          { title: "Ghi chú", render: (_, r) => r.note || "—" },
          { title: "Ngày", render: (_, r) => formatDateTime(r.createdAt) },
          {
            title: "Trạng thái",
            render: (_, r) => (
              <Badge variant={(STATUS_VARIANT[r.status] || "default") as any}>
                {STATUS_LABEL[r.status] || r.status}
              </Badge>
            ),
          },
          {
            title: "",
            render: (_, r) => r.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => approveMut.mutate({ id: r.id, adminId })} isLoading={approveMut.isPending}>
                  Duyệt
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setRejectId(r.id)}>
                  Từ chối
                </Button>
              </div>
            ) : null,
          },
        ]}
        pagination={buildPagination(
          page,
          20,
          data?.totalElements ?? 0,
          (p: number) => setPage(p),
          () => {}
        )}
      />

      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) setRejectId(null); }} title="Từ chối">
        <div className="space-y-4 pt-4">
          <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectId(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleReject} isLoading={rejectMut.isPending}>Từ chối</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
