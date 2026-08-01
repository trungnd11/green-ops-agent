import type { AuditLogResponse } from "../../api/audit-log.api";

const actionLabel: Record<string, string> = {
  ASSIGN_ROLE: "Gán vai trò",
  CREATE_ROLE: "Tạo vai trò",
  UPDATE_ROLE: "Cập nhật vai trò",
  DELETE_ROLE: "Xóa vai trò",
  CREATE_USER: "Tạo người dùng",
  UPDATE_USER: "Cập nhật người dùng",
  REMOVE_USER: "Xóa người dùng",
  ROLE_PERMISSIONS_REPLACED: "Thay đổi quyền",
  ROLE_CREATED: "Vai trò được tạo",
  ROLE_UPDATED: "Vai trò được cập nhật",
  ROLE_DELETED: "Vai trò bị xóa",
  MODULE_CREATED: "Tạo module",
  MODULE_UPDATED: "Cập nhật module",
  MODULE_DELETED: "Xóa module",
  PERMISSION_CREATED: "Tạo quyền",
  PERMISSION_UPDATED: "Cập nhật quyền",
  PERMISSION_DELETED: "Xóa quyền",
};

const actionColor: Record<string, string> = {
  ASSIGN_ROLE: "#22C55E",
  CREATE_ROLE: "#00AEEF",
  UPDATE_ROLE: "#F59E0B",
  DELETE_ROLE: "#F05252",
  CREATE_USER: "#00AEEF",
  UPDATE_USER: "#F59E0B",
  REMOVE_USER: "#F05252",
  ROLE_PERMISSIONS_REPLACED: "#8B5CF6",
  ROLE_CREATED: "#00AEEF",
  ROLE_UPDATED: "#F59E0B",
  ROLE_DELETED: "#F05252",
  MODULE_CREATED: "#00AEEF",
  MODULE_UPDATED: "#F59E0B",
  MODULE_DELETED: "#F05252",
  PERMISSION_CREATED: "#00AEEF",
  PERMISSION_UPDATED: "#F59E0B",
  PERMISSION_DELETED: "#F05252",
};

export function useAuditLogTable() {
  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 200,
      render: (text: string) => (
        <span className="text-text-primary text-[13px]">{text ? new Date(text).toLocaleString("vi-VN") : "—"}</span>
      ),
    },
    {
      title: "Người dùng",
      dataIndex: "actorName",
      width: 200,
      render: (text: string) => (
        <span className="text-text-primary text-[13px] truncate">{text || "Hệ thống"}</span>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      width: 200,
      render: (text: string) => (
        <span
          className="inline-flex items-center rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap"
          style={{
            height: "22px",
            background: `${actionColor[text] || "#8792A2"}1a`,
            color: actionColor[text] || "#8792A2",
          }}
        >
          {actionLabel[text] || text}
        </span>
      ),
    },
    {
      title: "Module",
      key: "module",
      width: 200,
      render: (_: string, record: AuditLogResponse) => (
        <span className="text-text-secondary text-[13px] truncate">{record.newData?.name || record.entityType}</span>
      ),
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (_: string, record: AuditLogResponse) => (
        <span className="text-text-tertiary text-[12px] truncate">
          {[record.entityType, record.entityId?.slice(0, 8)].filter(Boolean).join(" #")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: () => (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}
        >
          Thành công
        </span>
      ),
    },
  ];

  return { columns, actionLabel, actionColor };
}

export type { AuditLogResponse };
