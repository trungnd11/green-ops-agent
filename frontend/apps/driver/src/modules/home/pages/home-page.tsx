import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchDashboard } from "../../wallet/api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";

const TX_LABEL: Record<string, string> = {
  revenue: "Thanh toán chuyến đi",
  topup: "Nạp tiền từ ví",
  withdraw: "Rút tiền về ngân hàng",
  bonus: "Thưởng hoàn thành",
  penalty: "Phạt vi phạm",
  adjustment: "Điều chỉnh",
};

export function HomePage() {
  const navigate = useNavigate();
  const { data: dash, isLoading } = useQuery({
    queryKey: ["driver-dashboard"],
    queryFn: fetchDashboard,
  });

  const balance = dash?.availableBalance ?? 0;
  const totalBalance = dash?.totalBalance ?? 0;
  const held = totalBalance - balance;

  if (isLoading) return (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="table" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm text-text-secondary">Xin chào,</p>
          <h2 className="text-base font-semibold text-text-primary">{dash?.fullName || "..."}</h2>
        </div>
      </div>

      <div className="mx-4 rounded-2xl border border-border-default bg-surface-card p-5">
        <p className="text-xs text-text-secondary">Số dư khả dụng</p>
        <p className="mt-1 text-3xl font-bold text-brand-teal">{formatCurrency(balance)}</p>
        <p className="mt-1 text-xs text-text-tertiary">Tạm giữ: {formatCurrency(held)}</p>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-3">
        <button
          className="flex items-center justify-center gap-2 rounded-btn border border-brand-teal bg-bg-subtle py-3 text-sm font-semibold text-brand-teal cursor-pointer"
          onClick={() => navigate({ to: "/wallet" } as any)}
        >
          <ArrowDownLeft className="h-4 w-4" /> Nạp tiền
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-btn border border-brand-teal bg-bg-subtle py-3 text-sm font-semibold text-brand-teal cursor-pointer"
          onClick={() => navigate({ to: "/wallet" } as any)}
        >
          <ArrowUpRight className="h-4 w-4" /> Rút tiền
        </button>
      </div>

      <div className="mx-4">
        <div className="rounded-card border border-border-default bg-surface-card p-4">
          <h3 className="text-sm font-semibold text-text-primary">Quyết toán chờ phản hồi</h3>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-teal" />
              <span className="text-xs text-text-secondary">{dash?.latestPeriod || "—"}</span>
            </div>
            <span className="text-xs text-brand-teal">{formatCurrency(dash?.latestRevenue || 0)}</span>
          </div>
        </div>
      </div>

      <div className="mx-4">
        <div className="rounded-card border border-border-default bg-surface-card p-4">
          <h3 className="text-sm font-semibold text-text-primary">Doanh thu kỳ gần nhất</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Doanh thu chuyến</span>
              <span className="text-xs text-text-primary">{formatCurrency(dash?.latestRevenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Chuyến</span>
              <span className="text-xs text-text-primary">{dash?.latestTrips || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 pb-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Giao dịch gần đây</h3>
        <div className="space-y-3">
          {(dash?.recentTransactions || []).slice(0, 5).map((tx, i) => (
            <div key={tx.transactionCode || i} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">{TX_LABEL[tx.transactionType] || tx.transactionType}</p>
                <p className="text-xs text-text-tertiary">{formatDateTime(tx.createdAt)}</p>
              </div>
              <span className={`text-sm font-medium ${tx.amount > 0 ? "text-semantic-success" : "text-semantic-error"}`}>
                {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
          {(!dash?.recentTransactions || dash.recentTransactions.length === 0) && (
            <p className="text-xs text-text-tertiary text-center py-4">Chưa có giao dịch</p>
          )}
        </div>
      </div>
    </div>
  );
}
