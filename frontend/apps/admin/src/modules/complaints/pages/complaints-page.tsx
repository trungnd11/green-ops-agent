import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, RotateCcw, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Select } from "@xanh/ui/select";
import { Badge } from "@xanh/ui/badge";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { useComplaintList, useComplaintStats } from "../api/complaint.queries";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import type { Complaint } from "../api/complaint.types";

const STATUS_VARIANT: Record<string, string> = {
  pending: "warning",
  processing: "info",
  resolved: "success",
  rejected: "error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const CATEGORY_LABEL: Record<string, string> = {
  doanh_thu: "Doanh thu",
  khau_tru: "Khấu trừ",
  phat: "Phạt",
  khac: "Khác",
};

export function ComplaintsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("all");
  const [searchStatus, setSearchStatus] = useState("all");

  const { data, isFetching } = useComplaintList(searchStatus, page);
  const { data: stats } = useComplaintStats();

  const kpis = [
    { icon: AlertTriangle, label: "Mới", value: stats?.pending ?? 0, color: "#F59E0B" },
    { icon: RefreshCw, label: "Đang xử lý", value: stats?.processing ?? 0, color: "#38BDF8" },
    { icon: CheckCircle, label: "Đã giải quyết", value: stats?.resolved ?? 0, color: "#22C55E" },
    { icon: XCircle, label: "Đã từ chối", value: stats?.rejected ?? 0, color: "#F05252" },
  ];

  const handleSearch = useCallback(() => {
    setSearchStatus(status);
    setPage(0);
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus("all");
    setSearchStatus("all");
    setPage(0);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Khiếu nại
        </h1>
        <p className="text-text-secondary text-[13px]">Danh sách khiếu nại từ tài xế</p>
      </div>

      <div className="flex gap-4">
        {kpis.map((kpi) => (
          <StatsCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Trạng thái</p>
          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "processing", label: "Đang xử lý" },
              { value: "resolved", label: "Đã giải quyết" },
              { value: "rejected", label: "Đã từ chối" },
            ]}
          />
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="primary" leftIcon={<Search className="h-4 w-4" />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button variant="secondary" className="text-text-tertiary" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      </div>

      <Table<Complaint>
        dataSource={data?.items || []}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Mã KN", render: (_, r) => r.code },
          { title: "Tài xế", render: (_, r) => r.driverName || "—" },
          { title: "Loại", render: (_, r) => CATEGORY_LABEL[r.category] || r.category },
          { title: "Tiêu đề", render: (_, r) => r.title },
          { title: "Số tiền", render: (_, r) => r.amount ? formatCurrency(r.amount) : "—" },
          { title: "Ngày", render: (_, r) => formatDateTime(r.createdAt) },
          {
            title: "Trạng thái",
            render: (_, r) => (
              <Badge variant={(STATUS_VARIANT[r.status] || "default") as any}>
                {STATUS_LABEL[r.status] || r.status}
              </Badge>
            ),
          },
        ]}
        onRowClick={(r) => navigate({ to: `/complaints/${r.id}` } as any)}
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
