import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, MessageSquare, ArrowUpRight, XCircle, CheckCircle, Banknote } from "lucide-react";
import { fetchNotifications, markAllRead, markRead } from "../api/notification.api";
import { formatDateTime } from "@xanh/utils";

const TYPE_ICON: Record<string, typeof Wallet> = {
  withdrawal_approved: ArrowUpRight,
  withdrawal_rejected: XCircle,
  topup_approved: Banknote,
  complaint_resolved: CheckCircle,
  complaint_rejected: XCircle,
};

const TYPE_COLOR: Record<string, string> = {
  withdrawal_approved: "bg-green-500/20 text-green-500",
  withdrawal_rejected: "bg-red-500/20 text-red-500",
  topup_approved: "bg-blue-500/20 text-blue-500",
  complaint_resolved: "bg-green-500/20 text-green-500",
  complaint_rejected: "bg-red-500/20 text-red-500",
};

export function NotificationPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["driver-notifications", page],
    queryFn: () => fetchNotifications(page),
  });

  const markMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-notifications"] }),
  });

  const handleClick = (notif: { id: string; type: string; isRead: boolean; referenceType?: string; referenceId?: string }) => {
    if (!notif.isRead) {
      markRead(notif.id).then(() => {
        qc.invalidateQueries({ queryKey: ["driver-notifications"] });
        qc.invalidateQueries({ queryKey: ["driver-notifications-unread"] });
      });
    }
    if (notif.type?.startsWith("withdrawal") || notif.type?.startsWith("topup")) {
      navigate({ to: "/wallet" } as any);
    } else if (notif.type?.startsWith("complaint")) {
      navigate({ to: "/complaints" } as any);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-bold text-text-primary">Thông báo</h1>
        <button
          onClick={() => markMut.mutate()}
          className="text-xs text-brand-teal cursor-pointer"
        >
          Đã đọc tất cả
        </button>
      </div>

      <div className="space-y-2 px-4 pb-4">
        {(data?.items || []).length === 0 && !isLoading && (
          <p className="text-center text-text-tertiary py-8">Không có thông báo</p>
        )}
        {(data?.items || []).map((notif) => {
          const Icon = TYPE_ICON[notif.type] || MessageSquare;
          const colorClass = TYPE_COLOR[notif.type] || "bg-brand-cyan/10";
          return (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 border-b border-border-default pb-4 last:border-0 cursor-pointer hover:bg-bg-subtle -mx-4 px-4 py-2 rounded-btn transition-colors ${
                !notif.isRead ? "opacity-100" : "opacity-60"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-btn ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">
                    {notif.title}
                  </h4>
                  {!notif.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-teal" />}
                </div>
                <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{notif.message}</p>
                <p className="mt-1 text-[10px] text-text-tertiary">{formatDateTime(notif.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
