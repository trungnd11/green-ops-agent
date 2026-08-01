import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@xanh/ui/skeleton";
import { Plus, MessageSquare } from "lucide-react";
import { fetchMyComplaints } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-500",
  processing: "text-blue-500",
  resolved: "text-green-500",
  rejected: "text-red-500",
};

export function ComplaintListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-complaints", page],
    queryFn: () => fetchMyComplaints(page),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Khiếu nại</h1>
        <button
          className="flex items-center gap-1.5 rounded-btn bg-brand-teal px-4 py-2 text-sm font-medium text-text-inverse"
          onClick={() => navigate({ to: "/complaints/create" } as any)}
        >
          <Plus className="h-4 w-4" /> Tạo khiếu nại
        </button>
      </div>

      {error && (
        <div className="rounded-card border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
          {error.message}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.items?.map((c) => (
          <div
            key={c.id}
            className="rounded-card border border-border-default bg-surface-card p-4 cursor-pointer hover:bg-bg-subtle"
            onClick={() => navigate({ to: `/complaints/${c.id}` } as any)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-text-tertiary" />
                <span className="text-xs text-text-tertiary">{c.code}</span>
              </div>
              <span className={`text-xs font-medium ${STATUS_COLOR[c.status] || ""}`}>
                {STATUS_LABEL[c.status] || c.status}
              </span>
            </div>
            <p className="text-sm font-medium mb-1">{c.title}</p>
            <p className="text-xs text-text-tertiary">{formatDateTime(c.createdAt)}</p>
          </div>
        ))}
        {(!data || data.items.length === 0) && !error && (
          <p className="text-center text-text-tertiary py-8">Chưa có khiếu nại nào</p>
        )}
      </div>
    </div>
  );
}
