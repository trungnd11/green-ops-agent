import { Edit3, Trash2 } from "lucide-react";
import { Popconfirm } from "@xanh/ui/popconfirm";

export function sttColumn(page: number, pageSize: number) {
  return {
    title: "STT",
    key: "stt",
    width: 50,
    render: (_: unknown, __: unknown, index: number) => (
      <span className="text-text-tertiary text-[13px]">{page * pageSize + index + 1}</span>
    ),
  };
}

type StatusConfig = Record<string, { label: string; color: string }>;

export function statusColumn<T extends string>(statusMap: StatusConfig) {
  return {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (text: T) => {
      const cfg = statusMap[text as string];
      const color = cfg?.color ?? "#8792A2";
      const label = cfg?.label ?? text;
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      );
    },
  };
}

export function dateColumn(title: string, dataIndex: string, width = 160) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (text: string) => (
      <span className="text-text-tertiary text-[13px]">{text ? new Date(text).toLocaleString("vi-VN") : "—"}</span>
    ),
  };
}

export function actionColumn<T extends { id: string; status?: string }>(
  onEdit: (record: T) => void,
  onDelete: (record: T) => void,
  canDelete?: (record: T) => boolean
) {
  return {
    title: "",
    key: "action",
    width: 60,
    render: (_: unknown, record: T) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          className="text-brand-cyan inline-flex items-center gap-0.5 px-1 text-[12px] hover:underline"
          onClick={() => onEdit(record)}
        >
          <Edit3 className="h-3 w-3" /> Sửa
        </button>
        {(canDelete ? canDelete(record) : record.status !== "inactive") && (
          <>
            <span className="text-text-tertiary text-[12px]">|</span>
            <Popconfirm
              title="Bạn có muốn xóa?"
              onConfirm={() => onDelete(record)}
              okText="Xác nhận xoá"
              cancelText="Hủy"
              placement="left"
            >
              <button className="text-semantic-error inline-flex items-center gap-0.5 px-1 text-[12px] hover:underline">
                <Trash2 className="h-3 w-3" /> Xóa
              </button>
            </Popconfirm>
          </>
        )}
      </div>
    ),
  };
}
