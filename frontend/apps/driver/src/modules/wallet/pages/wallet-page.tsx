import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@xanh/ui/dialog";
import { Input } from "@xanh/ui/input";
import { Button } from "@xanh/ui/button";
import { Skeleton } from "@xanh/ui/skeleton";
import { notification } from "@xanh/ui/notification";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { fetchDashboard, fetchTransactions, requestWithdraw, requestTopup, type DashboardData, type TransactionItem } from "../api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";

const TX_LABEL: Record<string, string> = {
  revenue: "Doanh thu chuyến",
  topup: "Nạp tiền",
  withdraw: "Rút tiền",
  bonus: "Thưởng",
  penalty: "Phạt",
  adjustment: "Điều chỉnh",
};

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "text-yellow-500",
  APPROVED: "text-green-500",
  REJECTED: "text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Thành công",
  REJECTED: "Từ chối",
};

export function WalletPage() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("");

  const filterMap: Record<string, string> = {
    Nạp: "topup",
    Rút: "withdraw",
    "Doanh thu": "revenue",
    Phạt: "penalty",
    "Điều chỉnh": "adjustment",
  };
  const typeFilter = filter ? filterMap[filter] : undefined;
  const qc = useQueryClient();

  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["driver-dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useQuery<TransactionItem[]>({
    queryKey: ["driver-transactions", typeFilter],
    queryFn: () => fetchTransactions(0, 50, typeFilter),
    placeholderData: (prev) => prev,
  });

  const topupMut = useMutation({
    mutationFn: () => requestTopup(Number(amount), 'Chuyển khoản ngân hàng'),
    onSuccess: () => {
      setShowTopup(false);
      setAmount("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["driver-dashboard"] });
      qc.invalidateQueries({ queryKey: ["driver-transactions"] });
      notification.success({ message: "Yêu cầu nạp tiền đã được gửi", placement: "bottomRight" });
    },
    onError: (err: Error) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
  });

  const withdrawMut = useMutation({
    mutationFn: () => requestWithdraw(Number(amount), bankInfo, note || undefined),
    onSuccess: () => {
      setShowWithdraw(false);
      setAmount("");
      setBankInfo("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["driver-dashboard"] });
      qc.invalidateQueries({ queryKey: ["driver-transactions"] });
      notification.success({ message: "Yêu cầu rút tiền đã được gửi", placement: "bottomRight" });
    },
    onError: (err: Error) => {
      notification.error({ message: "Lỗi", description: err.message, placement: "bottomRight" });
    },
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
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      <h1 className="text-xl font-bold text-text-primary">Ví</h1>

      <div className="rounded-2xl border border-border-default bg-surface-card p-5">
        <p className="text-xs text-text-secondary">Số dư khả dụng</p>
        <p className="mt-1 text-3xl font-bold text-brand-teal">{formatCurrency(balance)}</p>
        <div className="mt-3 border-t border-border-default pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Tổng số dư</span>
            <span className="text-text-primary">{formatCurrency(totalBalance)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Tạm giữ</span>
            <span className="text-text-primary">{formatCurrency(held)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="flex items-center justify-center gap-2 rounded-btn border border-brand-teal bg-bg-subtle py-3 text-sm font-semibold text-brand-teal cursor-pointer"
          onClick={() => setShowTopup(true)}
        >
          <ArrowDownLeft className="h-4 w-4" /> Nạp tiền
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-btn border border-brand-teal bg-bg-subtle py-3 text-sm font-semibold text-brand-teal cursor-pointer"
          onClick={() => setShowWithdraw(true)}
        >
          <ArrowUpRight className="h-4 w-4" /> Rút tiền
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["", "Nạp", "Rút", "Doanh thu", "Phạt", "Điều chỉnh"].map((chip) => (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            className={`rounded-pill px-2 py-2 text-xs font-medium transition-colors text-center cursor-pointer ${
              filter === chip
                ? "bg-brand-teal text-text-inverse"
                : "bg-bg-subtle text-text-secondary border border-border-default"
            }`}
          >
            {chip || "Tất cả"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {txFetching ? (
          <>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </>
        ) : transactions.map((tx, i) => (
          <div key={tx.transactionCode || i} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">{TX_LABEL[tx.transactionType] || tx.transactionType}</p>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Clock className="h-3 w-3" />
                <span>{formatDateTime(tx.createdAt)}</span>
                <span className={STATUS_VARIANT[tx.status] || ""}>{STATUS_LABEL[tx.status] || tx.status}</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${tx.amount > 0 ? "text-semantic-success" : "text-semantic-error"}`}>
              {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
        {!txFetching && !txLoading && transactions.length === 0 && (
          <p className="text-center text-text-tertiary py-8">Không có giao dịch</p>
        )}
      </div>

      <Dialog open={showTopup} onOpenChange={setShowTopup} title="Nạp tiền">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">Nhập số tiền muốn nạp</p>
          <div>
            <label className="text-sm font-medium block mb-1">Số tiền</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nhập số tiền" />
            {Number(amount) > 0 && <p className="text-xs text-text-tertiary mt-1">{formatCurrency(Number(amount))}</p>}
          </div>
          <p className="text-xs text-text-secondary">Phương thức: Chuyển khoản ngân hàng</p>
          {topupMut.isError && (
            <p className="text-sm text-red-500">{(topupMut.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowTopup(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => topupMut.mutate()} isLoading={topupMut.isPending} disabled={!amount || Number(amount) <= 0}>
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw} title="Rút tiền">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">Số dư khả dụng: {formatCurrency(balance)}</p>
          <div>
            <label className="text-sm font-medium block mb-1">Số tiền</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nhập số tiền" />
            {Number(amount) > 0 && <p className="text-xs text-text-tertiary mt-1">{formatCurrency(Number(amount))}</p>}
            {Number(amount) > 0 && Number(amount) > balance && (
              <p className="text-xs text-red-500 mt-1">Số dư không đủ (khả dụng: {formatCurrency(balance)})</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tài khoản nhận</label>
            <Input value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder="VD: Vietcombank - 1012345678" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Ghi chú</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" />
          </div>
          {withdrawMut.isError && (
            <p className="text-sm text-red-500">{(withdrawMut.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowWithdraw(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => withdrawMut.mutate()} isLoading={withdrawMut.isPending} disabled={!amount || !bankInfo || Number(amount) > balance}>
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
