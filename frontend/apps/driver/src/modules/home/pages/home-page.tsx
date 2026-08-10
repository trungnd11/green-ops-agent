import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchDashboard } from "../../wallet/api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import { IconTile, StatusPill, useWalletSheets } from "../../../shared";

const TX_LABEL: Record<string, string> = {
  revenue: "Thanh toán chuyến đi",
  topup: "Nạp tiền từ ví",
  withdraw: "Rút tiền về ngân hàng",
  bonus: "Thưởng hoàn thành",
  penalty: "Phạt vi phạm",
  adjustment: "Điều chỉnh",
};

const TX_TILE: Record<string, "ok" | "accent" | "info" | "bad"> = {
  revenue: "ok",
  topup: "accent",
  withdraw: "info",
  bonus: "ok",
  penalty: "bad",
  adjustment: "info",
};

export function HomePage() {
  const { openTopup, openWithdraw } = useWalletSheets();
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
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="row-between">
        <div>
          <p className="muted" style={{ fontSize: 14 }}>Xin chào,</p>
          <h2 className="h1">{dash?.fullName || "..."}</h2>
          <p className="meta" style={{ marginTop: 3 }}>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>
        <div className="icon-tile accent" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16M4 9h10M4 13h16M4 17h7" />
          </svg>
        </div>
      </div>

      <div className="hero" data-od-id="home-balance">
        <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Số dư khả dụng</p>
        <p className="hero-value num" style={{ marginTop: 6 }}>{formatCurrency(balance)}</p>
        <div className="row-between" style={{ marginTop: 16, borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
          <span className="meta">Tạm giữ</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(held)}</span>
        </div>
      </div>

      <div className="action-grid" data-od-id="home-actions">
        <button type="button" className="action-card primary" onClick={openTopup}>
          <ArrowUp size={19} strokeWidth={1.9} /> Nạp tiền
        </button>
        <button type="button" className="action-card" onClick={openWithdraw}>
          <ArrowDown size={19} strokeWidth={1.9} /> Rút tiền
        </button>
      </div>

      <div className="card glass tap" data-od-id="home-settlement">
        <div className="row-between">
          <div>
            <p className="section-title">Quyết toán chờ phản hồi</p>
            <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "—"}</p>
          </div>
          <StatusPill variant="pending">Đang xử lý</StatusPill>
        </div>
        <div className="row-between" style={{ marginTop: 14 }}>
          <span className="muted" style={{ fontSize: 13 }}>Doanh thu kỳ</span>
          <span className="num" style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>
            {formatCurrency(dash?.latestRevenue || 0)}
          </span>
        </div>
      </div>

      <div className="stat-grid" data-od-id="home-stats">
        <div className="stat glass">
          <p className="stat-label">Doanh thu chuyến</p>
          <p className="stat-value num">{formatCurrency(dash?.latestRevenue || 0)}</p>
          <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "Kỳ gần nhất"}</p>
        </div>
        <div className="stat glass">
          <p className="stat-label">Chuyến hoàn thành</p>
          <p className="stat-value num">{dash?.latestTrips || 0}</p>
          <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "Kỳ gần nhất"}</p>
        </div>
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Giao dịch gần đây</h3>
        </div>
        <div className="card glass" style={{ padding: "8px 20px", display: "flex", flexDirection: "column" }} data-od-id="home-txs">
          {(dash?.recentTransactions || []).slice(0, 5).map((tx, i, arr) => (
            <div key={tx.transactionCode || i}>
              <div className="row" style={{ padding: "14px 0" }}>
                <IconTile variant={TX_TILE[tx.transactionType] || "info"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12.5l2.6 2.6L16 9.5" />
                  </svg>
                </IconTile>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{TX_LABEL[tx.transactionType] || tx.transactionType}</p>
                  <p className="meta" style={{ marginTop: 2 }}>{formatDateTime(tx.createdAt)}</p>
                </div>
                <span className="num" style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                  {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                </span>
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          ))}
          {(!dash?.recentTransactions || dash.recentTransactions.length === 0) && (
            <p className="meta" style={{ textAlign: "center", padding: "26px 0" }}>Chưa có giao dịch</p>
          )}
        </div>
      </div>
    </div>
  );
}
