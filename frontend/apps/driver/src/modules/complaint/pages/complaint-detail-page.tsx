import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { fetchMyComplaints } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";

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
  const { id } = useParams({ from: "/_auth/complaints/$id" });
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["driver-complaints", "all"],
    queryFn: () => fetchMyComplaints(0, 100),
    select: (d) => d.items.find((c) => c.id === id),
  });

  if (!data) return <div className="p-4 text-text-tertiary">Đang tải...</div>;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/complaints" } as any)} className="p-1 cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Chi tiết khiếu nại</h1>
      </div>

      <div className="rounded-card border border-border-default bg-surface-card p-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-default">
          <MessageSquare className="h-4 w-4 text-text-tertiary" />
          <span className="text-xs text-text-tertiary">{data.code}</span>
          <span className={`text-xs font-medium ml-auto ${data.status === "resolved" ? "text-green-500" : data.status === "rejected" ? "text-red-500" : "text-yellow-500"}`}>
            {STATUS_LABEL[data.status] || data.status}
          </span>
        </div>

        <div className="pt-3 pb-3 border-b border-border-default">
          <p className="text-sm font-medium mb-2">{data.title}</p>
          <div className="text-xs text-text-secondary space-y-1">
            <p>Loại: {CATEGORY_LABEL[data.category] || data.category}</p>
            {data.amount > 0 && <p>Số tiền: {data.amount.toLocaleString("vi-VN")}₫</p>}
            <p>Ngày gửi: {formatDateTime(data.createdAt)}</p>
          </div>
        </div>

        {data.description && (
          <div className="pt-3 pb-3 border-b border-border-default">
            <p className="text-xs text-text-secondary mb-1.5">Nội dung</p>
            <p className="text-sm whitespace-pre-wrap bg-bg-canvas rounded-btn p-4">{data.description}</p>
          </div>
        )}

        {data.response && (
          <div className="pt-3">
            <p className="text-xs text-text-secondary mb-1.5">{data.status === "rejected" ? "Lý do từ chối" : "Phản hồi"}</p>
            <p className="text-sm whitespace-pre-wrap bg-bg-subtle rounded-btn p-4">{data.response}</p>
            {data.respondedByName && (
              <p className="text-xs text-text-tertiary mt-1.5">Bởi {data.respondedByName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
