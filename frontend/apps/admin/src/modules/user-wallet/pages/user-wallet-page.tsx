import { useState } from "react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Dialog } from "@xanh/ui/dialog";
import { Input } from "@xanh/ui/input";
import { ArrowUpRight, Wallet, DollarSign } from "lucide-react";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { useWalletBalance, useWalletTransactions, useRequestWithdraw } from "../api/user-wallet.queries";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import type { UserTransaction } from "../api/user-wallet.types";

const TX_TYPE_LABEL: Record<string, string> = {
  commission: "Hoa hồng",
  withdrawal: "Rút tiền",
  adjustment: "Điều chỉnh",
};

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  PAID: "info",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  PAID: "Đã thanh toán",
};

export function UserWalletPage() {
  const [page, setPage] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: transactions, isFetching } = useWalletTransactions(page);

  const withdrawMutation = useRequestWithdraw();

  const handleWithdraw = () => {
    withdrawMutation.mutate({
      amount: Number(amount),
      bankName,
      bankAccount,
      bankHolder,
    }, {
      onSuccess: () => {
        setShowWithdraw(false);
        setAmount("");
        setBankName("");
        setBankAccount("");
        setBankHolder("");
      },
    });
  };

  const items = transactions?.items || [];

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Ví User
        </h1>
        <p className="text-text-secondary text-[13px]">Quản lý số dư và giao dịch user</p>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={Wallet} label="Số dư khả dụng" value={balanceLoading ? "..." : formatCurrency(balance?.availableBalance || 0)} color="#00C7A5" />
        <StatsCard icon={DollarSign} label="Tổng giao dịch" value={transactions?.totalElements ?? 0} color="#F8FAFC" />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" leftIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => setShowWithdraw(true)}>
          Rút tiền
        </Button>
      </div>

      <Table<UserTransaction>
        dataSource={items}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Ngày", render: (_, r) => formatDateTime(r.createdAt) },
          { title: "Loại", render: (_, r) => TX_TYPE_LABEL[r.transactionType] || r.transactionType },
          {
            title: "Số tiền",
            render: (_, r) => (
              <span className={r.amount > 0 ? "text-green-500" : "text-red-500"}>
                {r.amount > 0 ? "+" : ""}{formatCurrency(r.amount)}
              </span>
            ),
          },
          { title: "Số dư sau", render: (_, r) => formatCurrency(r.balanceAfter) },
          {
            title: "Trạng thái",
            render: (_, r) => <Badge variant={STATUS_VARIANT[r.status] as any}>{STATUS_LABEL[r.status]}</Badge>,
          },
          { title: "Ghi chú", render: (_, r) => r.note || "" },
        ]}
        pagination={buildPagination(
          page,
          20,
          transactions?.totalElements ?? 0,
          (p: number) => setPage(p),
          () => {}
        )}
      />

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw} title="Rút tiền">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">Số dư hiện tại: {formatCurrency(balance?.availableBalance || 0)}</p>
          <div>
            <label className="text-sm font-medium block mb-1">Số tiền</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nhập số tiền" />
            {Number(amount) > 0 && <p className="text-xs text-text-tertiary mt-1">{formatCurrency(Number(amount))}</p>}
            {Number(amount) > 0 && Number(amount) > (balance?.availableBalance || 0) && (
              <p className="text-xs text-red-500 mt-1">Số dư không đủ (khả dụng: {formatCurrency(balance?.availableBalance || 0)})</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Ngân hàng</label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Số tài khoản</label>
            <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="VD: 1012345678" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Chủ tài khoản</label>
            <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="VD: NGUYEN VAN A" />
          </div>
          {withdrawMutation.isError && (
            <p className="text-sm text-red-500">{(withdrawMutation.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowWithdraw(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleWithdraw} isLoading={withdrawMutation.isPending} disabled={!amount || !bankName || !bankAccount}>
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
