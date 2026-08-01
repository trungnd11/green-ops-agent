import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card } from "@xanh/ui/card";
import { Badge } from "@xanh/ui/badge";
import { Button } from "@xanh/ui";
import { Input } from "@xanh/ui/input";
import { Dialog } from "@xanh/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useComplaint, useRespondComplaint } from "../api/complaint.queries";
import { formatDate } from "@xanh/utils";

const STATUS_VARIANT: Record<string, string> = {
  pending: "warning",
  processing: "info",
  resolved: "success",
  rejected: "error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const CATEGORY_LABEL: Record<string, string> = {
  doanh_thu: "Doanh thu",
  khau_tru: "Khấu trừ",
  phat: "Phạt",
  khac: "Khác",
};

export function ComplaintDetailPage() {
  const { id } = useParams({ from: "/_authenticated/complaints/$id" });
  const navigate = useNavigate();
  const [response, setResponse] = useState("");
  const [confirmAction, setConfirmAction] = useState<"resolve" | "reject" | null>(null);
  const respondMut = useRespondComplaint();

  const { data: complaint, isLoading } = useComplaint(id);

  if (isLoading) return <div className="p-8 text-text-secondary">Đang tải...</div>;
  if (!complaint) return <div className="p-8 text-text-secondary">Không tìm thấy</div>;

  const canRespond = complaint.status === "pending" || complaint.status === "processing";

  const handleConfirm = () => {
    if (!confirmAction) return;
    respondMut.mutate({ id, action: confirmAction, response }, {
      onSuccess: () => setConfirmAction(null),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/complaints" } as any)} className="p-2 rounded-btn hover:bg-bg-subtle">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold">Khiếu nại {complaint.code}</h1>
        <Badge variant={(STATUS_VARIANT[complaint.status] || "default") as any}>
          {STATUS_LABEL[complaint.status] || complaint.status}
        </Badge>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Tài xế</p>
            <p className="text-sm font-medium">{complaint.driverName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Mã tài xế</p>
            <p className="text-sm font-medium">{complaint.driverCode || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Loại</p>
            <p className="text-sm font-medium">{CATEGORY_LABEL[complaint.category] || complaint.category}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Số tiền</p>
            <p className="text-sm font-medium">{complaint.amount ? `${complaint.amount.toLocaleString("vi-VN")}₫` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Ngày tạo</p>
            <p className="text-sm font-medium">{formatDate(complaint.createdAt)}</p>
          </div>
          {complaint.settlementCode && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Quyết toán</p>
              <p className="text-sm font-medium">{complaint.settlementCode}</p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border-default">
          <p className="text-xs text-text-secondary mb-1.5">Tiêu đề</p>
          <p className="text-sm font-medium">{complaint.title}</p>
        </div>

        {complaint.description && (
          <div className="mt-5">
            <p className="text-xs text-text-secondary mb-1.5">Nội dung</p>
            <p className="text-sm whitespace-pre-wrap bg-bg-subtle rounded-btn p-4">{complaint.description}</p>
          </div>
        )}
      </Card>

      {canRespond && (
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold">Phản hồi</h2>
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Nhập nội dung phản hồi..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              leftIcon={<CheckCircle className="h-4 w-4" />}
              onClick={() => setConfirmAction("resolve")}
              disabled={!response}
            >
              Giải quyết
            </Button>
            <Button
              variant="secondary"
              leftIcon={<XCircle className="h-4 w-4" />}
              className="!border-red-500 !text-red-500 hover:!bg-red-500/5"
              onClick={() => setConfirmAction("reject")}
            >
              Từ chối
            </Button>
          </div>
        </Card>
      )}

      {complaint.response && (
        <Card className="p-5 space-y-2">
          <h2 className="text-base font-semibold">{complaint.status === "rejected" ? "Lý do từ chối" : "Phản hồi từ hệ thống"}</h2>
          {complaint.respondedByName && (
            <p className="text-xs text-text-secondary">
              Bởi {complaint.respondedByName} - {formatDate(complaint.respondedAt || "")}
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap bg-bg-subtle rounded-btn p-3">{complaint.response}</p>
        </Card>
      )}

      <Dialog
        open={!!confirmAction}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title={confirmAction === "resolve" ? "Xác nhận giải quyết" : "Xác nhận từ chối"}
      >
        <div className="space-y-4 pt-4">
          <p className="text-sm text-text-secondary">
            {confirmAction === "resolve"
              ? "Bạn có chắc muốn giải quyết khiếu nại này?"
              : "Bạn có chắc muốn từ chối khiếu nại này?"}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Hủy</Button>
            <Button
              variant={confirmAction === "resolve" ? "primary" : "secondary"}
              className={confirmAction === "reject" ? "!border-red-500 !text-red-500" : ""}
              onClick={handleConfirm}
              isLoading={respondMut.isPending}
            >
              {confirmAction === "resolve" ? "Xác nhận" : "Từ chối"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
