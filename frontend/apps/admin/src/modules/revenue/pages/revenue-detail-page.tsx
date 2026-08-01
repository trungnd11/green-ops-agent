import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@xanh/ui/table";
import { Card } from "@xanh/ui/card";
import { Badge } from "@xanh/ui/badge";
import { Button } from "@xanh/ui";
import { ArrowLeft, Upload } from "lucide-react";
import { revenueQueries } from "../api/revenue.queries";
import type { RevenueDetail } from "../api/revenue.types";
import { formatCurrency } from "@xanh/utils";

export function RevenueDetailPage() {
  const { periodId } = useParams({ from: "/_authenticated/revenues/$periodId" });
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data: period, isLoading: periodLoading } = useQuery(revenueQueries.period(periodId));
  const { data: details, isLoading: detailsLoading } = useQuery(revenueQueries.details(periodId, { page }));

  const items = details?.items || [];
  const stats = items.reduce((acc: { totalRevenue: number; totalTrips: number; totalDeduction: number; totalAddition: number }, r: RevenueDetail) => ({
    totalRevenue: acc.totalRevenue + r.totalRevenue,
    totalTrips: acc.totalTrips + r.totalTrips,
    totalDeduction: acc.totalDeduction + r.totalDeduction,
    totalAddition: acc.totalAddition + r.totalAddition,
  }), { totalRevenue: 0, totalTrips: 0, totalDeduction: 0, totalAddition: 0 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/revenues" } as any)} className="p-2 rounded-btn hover:bg-bg-subtle">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{period?.name || "..."}</h1>
          <p className="text-sm text-text-tertiary">
            {period ? `${period.startDate} - ${period.endDate}` : ""}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate({ to: "/revenues/import" } as any)}>
          <Upload className="h-4 w-4" /> Import lại
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Tổng doanh thu</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Tổng tài xế</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Tổng chuyến</p>
          <p className="text-2xl font-bold">{stats.totalTrips}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Phí GD</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalDeduction)}</p>
        </Card>
      </div>

      <Card className="p-0">
        <Table<RevenueDetail>
          dataSource={items}
          isLoading={detailsLoading}
          columns={[
            { title: "Mã LX", render: (_, r) => r.driverCode },
            { title: "Tên", render: (_, r) => r.driverName },
            { title: "Doanh thu", render: (_, r) => formatCurrency(r.totalRevenue) },
            { title: "Chuyến", render: (_, r) => r.totalTrips },
            { title: "Bảo hiểm", render: (_, r) => formatCurrency(r.insuranceFee) },
            { title: "Phí GD", render: (_, r) => formatCurrency(r.nonCashFee) },
            { title: "Chiết khấu+thuế", render: (_, r) => formatCurrency(r.discountTax) },
            { title: "Thưởng", render: (_, r) => formatCurrency(r.bonus) },
            { title: "Thực nhận", render: (_, r) => formatCurrency(r.earnedAmount) },
          ]}
          onRowClick={(r) => navigate({ to: `/revenues/${periodId}/drivers/${r.id}` } as any)}
          pagination={{
            current: page + 1,
            pageSize: details?.size || 20,
            total: details?.totalElements || 0,
            onChange: (p: number) => setPage(p - 1),
            showSizeChanger: { size: "small" },
            pageSizeOptions: ["5", "10", "20", "50"],
            size: "small",
          }}
        />
      </Card>
    </div>
  );
}
