import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Dialog } from "@xanh/ui/dialog";
import { Input } from "@xanh/ui/input";
import { Select } from "@xanh/ui/select";
import { Check, X, Pencil, DollarSign, Clock, CheckCircle, Search, RotateCcw } from "lucide-react";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { commissionQueries, useReviewCommission } from "../api/commission.queries";
import type { CommissionLog, CommissionReviewRequest } from "../api/commission.types";
import { formatCurrency } from "@xanh/utils";

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

export function CommissionReviewPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [searchStatus, setSearchStatus] = useState("PENDING");
  const [selected, setSelected] = useState<CommissionLog | null>(null);
  const [dialogType, setDialogType] = useState<"adjust" | "reject" | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [reason, setReason] = useState("");
  const { data, isFetching } = useQuery(commissionQueries.list({ page, status: searchStatus }));
  const reviewMutation = useReviewCommission();

  const items = data?.items || [];
  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const approvedCount = items.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = items.filter((i) => i.status === "REJECTED").length;
  const totalCommission = items.reduce((sum, item) => sum + item.commissionAmount, 0);

  const handleReview = (id: string, action: CommissionReviewRequest) => {
    reviewMutation.mutate({ id, request: action });
  };

  const handleAdjust = () => {
    if (!selected) return;
    handleReview(selected.id, { action: "adjust", adjustedAmount: Number(adjustAmount), reason });
    setDialogType(null);
    setSelected(null);
  };

  const handleReject = () => {
    if (!selected) return;
    handleReview(selected.id, { action: "reject", reason });
    setDialogType(null);
    setSelected(null);
  };

  const handleSearch = useCallback(() => {
    setSearchStatus(status);
    setPage(0);
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus("PENDING");
    setSearchStatus("PENDING");
    setPage(0);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Duyệt hoa hồng
        </h1>
        <p className="text-text-secondary text-[13px]">Quản lý hoa hồng giới thiệu tài xế</p>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Clock} label="Chờ duyệt" value={pendingCount} color="#F59E0B" />
        <StatsCard icon={CheckCircle} label="Đã duyệt" value={approvedCount} color="#22C55E" />
        <StatsCard icon={DollarSign} label="Tổng hoa hồng" value={formatCurrency(totalCommission)} color="#00C7A5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Trạng thái</p>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v || "PENDING")}
            options={[
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
          <Button variant="secondary" className="text-text-tertiary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
            Đặt lại
          </Button>
        </div>
      </div>

      <Table<CommissionLog>
        dataSource={items}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Tài xế", render: (_, r) => <span>{r.driverCode} - {r.driverName}</span> },
          { title: "User giới thiệu", render: (_, r) => r.referrerName },
          { title: "Doanh thu", render: (_, r) => formatCurrency(r.revenueAmount) },
          {
            title: "Hoa hồng",
            render: (_, r) => (
              <span>
                {formatCurrency(r.commissionAmount)}
                {r.originalAmount && <span className="text-xs text-text-tertiary ml-1">(đã sửa từ {formatCurrency(r.originalAmount)})</span>}
                <span className="text-xs text-text-tertiary ml-1">({r.rate}%)</span>
              </span>
            ),
          },
          {
            title: "Trạng thái",
            render: (_, r) => <Badge variant={STATUS_VARIANT[r.status] as any}>{STATUS_LABELS[r.status]}</Badge>,
          },
          {
            title: "",
            render: (_, r) => r.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleReview(r.id, { action: "approve" })}>
                  <Check className="h-4 w-4" /> Duyệt
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setDialogType("adjust"); setAdjustAmount(String(r.commissionAmount)); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { setSelected(r); setDialogType("reject"); }}>
                  <X className="h-4 w-4" />
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

      <Dialog open={dialogType === "adjust"} onOpenChange={(o) => { if (!o) setDialogType(null); }} title="Chỉnh sửa hoa hồng">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">Tài xế: {selected?.driverCode} - {selected?.driverName}</p>
          <p className="text-sm text-text-secondary">User: {selected?.referrerName}</p>
          <p className="text-sm text-text-secondary">Doanh thu: {formatCurrency(selected?.revenueAmount || 0)}</p>
          <div>
            <label className="text-sm font-medium">Hoa hồng</label>
            <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Lý do</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do chỉnh sửa" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogType(null)}>Hủy</Button>
            <Button variant="primary" onClick={handleAdjust}>Lưu và duyệt</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={dialogType === "reject"} onOpenChange={(o) => { if (!o) setDialogType(null); }} title="Từ chối hoa hồng">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">Từ chối hoa hồng của {selected?.driverName}?</p>
          <div>
            <label className="text-sm font-medium">Lý do</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do từ chối" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogType(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleReject}>Từ chối</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
