import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@xanh/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";
import { fetchDashboard, fetchTransactions, type DashboardData, type TransactionItem } from "../api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import { IconTile, StatusPill, useWalletSheets } from "../../../shared";

const TX_LABEL: Record<string, string> = {
  revenue: "Doanh thu chuyến",
  topup: "Nạp tiền",
  withdraw: "Rút tiền",
  bonus: "Thưởng",
  penalty: "Phạt",
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

const STATUS_PILL: Record<string, "pending" | "ok" | "bad"> = {
  PENDING: "pending",
  APPROVED: "ok",
  REJECTED: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Thành công",
  REJECTED: "Từ chối",
};

export function WalletPage() {
  const { openTopup, openWithdraw } = useWalletSheets();
  const [filter, setFilter] = useState("");

  const filterMap: Record<string, string> = {
    Nạp: "topup",
    Rút: "withdraw",
    "Doanh thu": "revenue",
    Phạt: "penalty",
    "Điều chỉnh": "adjustment",
  };
  const typeFilter = filter ? filterMap[filter] : undefined;

  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["driver-dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useQuery<TransactionItem[]>({
    queryKey: ["driver-transactions", typeFilter],
    queryFn: () => fetchTransactions(0, 50, typeFilter),
    placeholderData: (prev) => prev,
  });

  const balance = dash?.availableBalance ?? 0;
  const totalBalance = dash?.totalBalance ?? 0;
  const held = totalBalance - balance;

  if (dashLoading || txLoading) return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="table" />
    </div>
  );

  const transactions = txData || [];

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 className="h1">Ví</h1>

      <div className="hero" data-od-id="wallet-balance">
        <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Số dư khả dụng</p>
        <p className="hero-value num" style={{ marginTop: 6 }}>{formatCurrency(balance)}</p>
        <div className="row-between" style={{ marginTop: 16, borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
          <span className="meta">Tổng số dư</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(totalBalance)}</span>
        </div>
        <div className="row-between" style={{ marginTop: 8 }}>
          <span className="meta">Tạm giữ</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(held)}</span>
        </div>
      </div>

      <div className="action-grid" data-od-id="wallet-actions">
        <button type="button" className="action-card primary" onClick={openTopup}>
          <ArrowUp size={19} strokeWidth={1.9} /> Nạp tiền
        </button>
        <button type="button" className="action-card" onClick={openWithdraw}>
          <ArrowDown size={19} strokeWidth={1.9} /> Rút tiền
        </button>
      </div>

      <div className="chips" data-od-id="wallet-filters" style={{ margin: "0 -4px" }}>
        {["", "Nạp", "Rút", "Doanh thu", "Phạt", "Điều chỉnh"].map((chip) => (
          <button
            key={chip}
            type="button"
            className={`chip ${filter === chip ? "active" : ""}`}
            onClick={() => setFilter(chip)}
          >
            {chip || "Tất cả"}
          </button>
        ))}
      </div>

      {txFetching ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <div className="card glass" style={{ padding: "8px 20px", display: "flex", flexDirection: "column" }} data-od-id="wallet-txlist">
          {transactions.map((tx, i, arr) => (
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
                <div style={{ textAlign: "right" }}>
                  <span className="num" style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                  </span>
                  <p style={{ marginTop: 4 }}>
                    <StatusPill variant={STATUS_PILL[tx.status] || "pending"}>{STATUS_LABEL[tx.status] || tx.status}</StatusPill>
                  </p>
                </div>
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="meta" style={{ textAlign: "center", padding: "26px 0" }}>Không có giao dịch</p>
          )}
        </div>
      )}
    </div>
  );
}
