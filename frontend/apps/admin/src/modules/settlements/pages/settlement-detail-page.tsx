import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@xanh/ui/table";
import { Card } from "@xanh/ui/card";
import { Badge } from "@xanh/ui/badge";
import { Button } from "@xanh/ui";
import { ArrowLeft } from "lucide-react";
import { useSettlement, useSettlementDetails, useApproveSettlement, usePaySettlement } from "../api/settlement.queries";
import { formatCurrency } from "@xanh/utils";
import type { SettlementDetail } from "../api/settlement.types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã thanh toán",
};

export function SettlementDetailPage() {
  const { id } = useParams({ from: "/_authenticated/settlements/$id" });
  const navigate = useNavigate();

  const { data: settlement, isLoading } = useSettlement(id);
  const { data: details } = useSettlementDetails(id);
  const approveMut = useApproveSettlement();
  const payMut = usePaySettlement();

  if (isLoading) return <div className="p-8 text-text-secondary">Đang tải...</div>;
  if (!settlement) return <div className="p-8 text-text-secondary">Không tìm thấy</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/settlements" } as any)} className="p-2 rounded-btn hover:bg-bg-subtle">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{settlement.settlementCode}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => approveMut.mutate(id)}
            isLoading={approveMut.isPending} disabled={settlement.status !== "draft" && settlement.status !== "pending"}>
            Duyệt
          </Button>
          <Button variant="secondary" onClick={() => payMut.mutate(id)}
            isLoading={payMut.isPending} disabled={settlement.status !== "approved"}>
            Đã thanh toán
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Doanh thu gộp</p>
          <p className="text-2xl font-bold">{formatCurrency(settlement.totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Khấu trừ</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(settlement.totalDeduction)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Cộng thêm</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(settlement.totalAddition)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Thực trả</p>
          <p className="text-2xl font-bold">{formatCurrency(settlement.totalPayout)}</p>
          <Badge variant={(settlement.status === "paid" ? "success" : "warning") as any}>
            {STATUS_LABEL[settlement.status] || settlement.status}
          </Badge>
        </Card>
      </div>

      <Card className="p-0">
        <Table<SettlementDetail>
          dataSource={details || []}
          columns={[
            { title: "Mã LX", render: (_, r) => r.driverCode },
            { title: "Tên", render: (_, r) => r.driverName },
            { title: "Doanh thu gộp", render: (_, r) => formatCurrency(r.grossRevenue) },
            { title: "Khấu trừ", render: (_, r) => formatCurrency(r.totalDeduction) },
            { title: "Cộng thêm", render: (_, r) => formatCurrency(r.totalAddition) },
            { title: "Thực nhận", render: (_, r) => formatCurrency(r.netPayable) },
            { title: "Tiền cọc", render: (_, r) => formatCurrency(r.currentDeposit) },
          ]}
        />
      </Card>
    </div>
  );
}
