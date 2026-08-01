import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@xanh/ui/card";
import { ArrowLeft } from "lucide-react";
import { revenueQueries } from "../api/revenue.queries";
import { formatCurrency } from "@xanh/utils";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-default last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

export function RevenueDriverDetailPage() {
  const { periodId, driverId } = useParams({ from: "/_authenticated/revenues/$periodId/drivers/$driverId" });
  const navigate = useNavigate();

  const { data: detail, isLoading } = useQuery(revenueQueries.driverDetail(periodId, driverId));

  if (isLoading) return <div className="p-8 text-text-secondary">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-text-secondary">Không tìm thấy</div>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: `/revenues/${periodId}` } as any)} className="p-2 rounded-btn hover:bg-bg-subtle">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{detail.driverName}</h1>
          <p className="text-sm text-text-tertiary">{detail.driverCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Doanh thu</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(detail.totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Thực nhận</p>
          <p className="text-2xl font-bold">{formatCurrency(detail.earnedAmount)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">Chi tiết doanh thu</h2>
        <InfoRow label="Tổng doanh thu" value={formatCurrency(detail.totalRevenue)} />
        <InfoRow label="Tổng chuyến" value={String(detail.totalTrips)} />
        <InfoRow label="Bảo hiểm" value={formatCurrency(detail.insuranceFee)} />
        <InfoRow label="Phí GD (không dùng tiền mặt)" value={formatCurrency(detail.nonCashFee)} />
        <InfoRow label="Chiết khấu + thuế" value={formatCurrency(detail.discountTax)} />
        <InfoRow label="Phạt" value={formatCurrency(detail.penalty)} />
        <InfoRow label="Chi phí khác" value={formatCurrency(detail.otherCost)} />
        <InfoRow label="Phụ thu" value={formatCurrency(detail.surcharge)} />
        <InfoRow label="Thưởng" value={formatCurrency(detail.bonus)} />
        <InfoRow label="Thu nhập khác" value={formatCurrency(detail.otherIncome)} />
        <InfoRow label="Tip" value={formatCurrency(detail.tip)} />
        <InfoRow label="Khuyến mãi" value={formatCurrency(detail.promotion)} />
        <InfoRow label="Hoàn trả" value={formatCurrency(detail.chargeRefund)} />
        <InfoRow label="Tổng khấu trừ" value={formatCurrency(detail.totalDeduction)} />
        <InfoRow label="Tổng cộng thêm" value={formatCurrency(detail.totalAddition)} />
      </Card>
    </div>
  );
}
