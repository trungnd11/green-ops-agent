import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Dialog } from "@xanh/ui/dialog";
import { Input } from "@xanh/ui/input";
import { Card } from "@xanh/ui/card";
import { Check, X } from "lucide-react";
import { useApproveWithdrawal, useRejectWithdrawal } from "../api/user-wallet.queries";
import { fetchPendingWithdrawals } from "../api/user-wallet.api";
import { formatCurrency, formatDate } from "@xanh/utils";
import type { UserTransaction } from "../api/user-wallet.types";

export function WithdrawalReviewPage() {
  const [page, setPage] = useState(0);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data } = useQuery({
    queryKey: ["user-wallet", "pending-withdrawals", page],
    queryFn: () => fetchPendingWithdrawals(page),
  });

  const approveMut = useApproveWithdrawal();
  const rejectMut = useRejectWithdrawal();

  const handleReject = () => {
    if (!rejectId) return;
    rejectMut.mutate({ id: rejectId, reason: rejectReason }, {
      onSuccess: () => { setRejectId(null); setRejectReason(""); },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Duyệt rút tiền</h1>

      <Card className="p-0">
        <Table<UserTransaction>
          dataSource={data?.items || []}
          columns={[
            { title: "Ngày", render: (_, r) => formatDate(r.createdAt) },
            { title: "User", render: (_, r) => r.userName },
            { title: "Số tiền", render: (_, r) => formatCurrency(Math.abs(r.amount)) },
            {
              title: "Tài khoản",
              render: (_, r) =>
                r.bankName ? `${r.bankName} - ${r.bankAccount} (${r.bankHolder})` : "",
            },
            { title: "Ghi chú", render: (_, r) => r.note || "" },
            {
              title: "",
              render: (_, r) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => approveMut.mutate(r.id)} isLoading={approveMut.isPending}>
                    <Check className="h-4 w-4" /> Duyệt
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setRejectId(r.id)}>
                    <X className="h-4 w-4" /> Từ chối
                  </Button>
                </div>
              ),
            },
          ]}
          pagination={{
            current: page + 1,
            pageSize: data?.size || 20,
            total: data?.totalElements || 0,
            onChange: (p: number) => setPage(p - 1),
            showSizeChanger: { size: "small" },
            pageSizeOptions: ["5", "10", "20", "50"],
            size: "small",
          }}
        />
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) setRejectId(null); }} title="Từ chối rút tiền">
        <div className="space-y-4 pt-4">
          <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectId(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleReject} isLoading={rejectMut.isPending}>Từ chối</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
