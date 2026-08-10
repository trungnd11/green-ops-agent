import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, XCircle, Banknote, CheckCircle, MessageSquare, type LucideIcon } from "lucide-react";
import { fetchNotifications, markAllRead, markRead } from "../api/notification.api";
import { formatDateTime } from "@xanh/utils";
import { IconTile, type TileVariant } from "../../../shared/icon-tile";

const TYPE_ICON: Record<string, LucideIcon> = {
  withdrawal_approved: ArrowUpRight,
  withdrawal_rejected: XCircle,
  topup_approved: Banknote,
  complaint_resolved: CheckCircle,
  complaint_rejected: XCircle,
};

const TYPE_TILE: Record<string, TileVariant> = {
  withdrawal_approved: "ok",
  withdrawal_rejected: "bad",
  topup_approved: "accent",
  complaint_resolved: "ok",
  complaint_rejected: "bad",
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
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h1 className="h1">Thông báo</h1>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 13, color: "var(--teal-fg)", fontWeight: 600 }}
          onClick={() => markMut.mutate()}
        >
          Đã đọc tất cả
        </button>
      </div>
      <div id="notifList" style={{ display: "flex", flexDirection: "column" }}>
        {(data?.items || []).length === 0 && !isLoading && (
          <p className="meta" style={{ textAlign: "center", padding: "32px 0" }}>Không có thông báo</p>
        )}
        {(data?.items || []).map((notif, i, arr) => {
          const Icon = TYPE_ICON[notif.type] || MessageSquare;
          return (
            <div key={notif.id}>
              <div
                className={`notif ${!notif.isRead ? "unread" : ""}`}
                style={{ opacity: notif.isRead ? 0.7 : 1 }}
                onClick={() => handleClick(notif)}
              >
                <IconTile variant={TYPE_TILE[notif.type] || "info"}>
                  <Icon size={18} strokeWidth={1.8} />
                </IconTile>
                <div className="body">
                  <p className="notif-title">{notif.title}</p>
                  <p className="notif-msg">{notif.message}</p>
                  <p className="notif-time">{formatDateTime(notif.createdAt)}</p>
                </div>
                {!notif.isRead && <span className="unread-dot" />}
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
