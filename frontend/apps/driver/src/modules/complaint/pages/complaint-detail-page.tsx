import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchMyComplaints } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";
import { StatusPill, type PillVariant } from "../../../shared";

const STATUS_PILL: Record<string, PillVariant> = {
  pending: "warn",
  processing: "pending",
  resolved: "ok",
  rejected: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

export function ComplaintDetailPage() {
  const { id } = useParams({ from: "/_auth/complaints/$id" });
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["driver-complaints", "all"],
    queryFn: () => fetchMyComplaints(0, 100),
    select: (d) => d.items.find((c) => c.id === id),
  });

  if (!data) return <div className="p-4 meta">Đang tải...</div>;

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <button type="button" className="back-btn" onClick={() => navigate({ to: "/complaints" } as never)}>
          <ArrowLeft size={18} strokeWidth={2} /> Khiếu nại
        </button>
        <StatusPill variant={STATUS_PILL[data.status] || "pending"}>{STATUS_LABEL[data.status] || data.status}</StatusPill>
      </div>

      <div className="card glass" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 className="h2">{data.title}</h1>
        <p className="meta">{data.code} · Gửi {formatDateTime(data.createdAt)}</p>
        <hr className="divider" style={{ margin: 0 }} />
        <div>
          <p className="section-title" style={{ fontSize: 15, marginBottom: 6 }}>Nội dung khiếu nại</p>
          <p className="body2" style={{ fontSize: 15, lineHeight: 1.6 }}>
            {data.description || "Không có mô tả."}
            {data.amount > 0 && ` Số tiền: ${data.amount.toLocaleString("vi-VN")} ₫`}
          </p>
        </div>
        {data.response && (
          <div className="glass-soft" style={{ borderRadius: 16, padding: 16 }}>
            <p className="section-title" style={{ fontSize: 14, marginBottom: 6 }}>
              {data.status === "rejected" ? "Lý do từ chối" : "Phản hồi"}
              {data.respondedAt ? ` · ${formatDateTime(data.respondedAt)}` : ""}
            </p>
            <p className="body2" style={{ fontSize: 14, lineHeight: 1.6 }}>{data.response}</p>
            {data.respondedByName && (
              <p className="meta" style={{ marginTop: 8 }}>Bởi {data.respondedByName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
