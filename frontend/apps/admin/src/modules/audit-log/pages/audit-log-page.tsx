import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Search,
  Download,
  FileText,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Input } from "@xanh/ui/input";
import { buildPagination } from "@/shared/utils/pagination";
import { Select } from "@xanh/ui/select";
import { Button } from "@xanh/ui/button";
import { Table } from "@xanh/ui/table";
import { DateRange } from "@xanh/ui/date-picker";
import { Drawer } from "@xanh/ui/drawer";
import type { DateRangeValue } from "@xanh/ui/date-picker";
import { useAuditLogQuery } from "../hooks/query/useAuditLogQuery";
import { useAuditLogTable } from "../hooks/table/useAuditLogTable";
import type { AuditLogResponse } from "../api/audit-log.api";

export function AuditLogPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/admin/audit-log" });
  const page = search.page ?? 0;
  const pageSize = search.pageSize ?? 10;
  const keyword = search.keyword ?? "";
  const fromDate = search.fromDate ?? "";
  const toDate = search.toDate ?? "";
  const actionFilter = search.actionType || undefined;

  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const { columns, actionLabel, actionColor } = useAuditLogTable();

  const updateSearch = (params: Record<string, unknown>) => {
    navigate({ to: "/admin/audit-log", search: { ...search, ...params, page: params.page ?? page } as any, replace: true });
  };

  const queryParams: Record<string, unknown> = { page, size: pageSize };
  if (keyword) queryParams.keyword = keyword;
  if (fromDate) queryParams.fromDate = fromDate;
  if (toDate) queryParams.toDate = toDate;
  if (actionFilter) queryParams.actionType = actionFilter;

  const { data, isLoading } = useAuditLogQuery(queryParams);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Nhật ký phân quyền
        </h1>
        <p className="text-text-secondary text-[13px]">
          Theo dõi các thay đổi liên quan đến người dùng, vai trò và quyền hạn.
        </p>
      </div>

      <div className="flex gap-4">
        {[
          { icon: FileText, label: "Tổng số bản ghi", value: data?.totalElements ?? "...", color: "#F8FAFC" },
          { icon: CheckCircle, label: "Thay đổi thành công", value: "—", color: "#22C55E" },
          { icon: AlertTriangle, label: "Thay đổi thất bại", value: "—", color: "#F05252" },
          { icon: ShieldAlert, label: "Cảnh báo", value: "—", color: "#F59E0B" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-card flex flex-1 flex-col gap-1 border p-4"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
          >
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
              <span className="text-text-secondary text-[13px]">{card.label}</span>
            </div>
            <span className="text-2xl font-bold leading-none" style={{ fontFamily: "Manrope", color: card.color }}>
              {typeof card.value === "number" ? card.value.toLocaleString("vi-VN") : card.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <DateRange
          value={fromDate && toDate ? { from: fromDate, to: toDate } : undefined as any}
          onChange={(v: DateRangeValue) => updateSearch({ fromDate: v.from, toDate: v.to, page: 0 })}
        />
        <Select
          value={actionFilter ?? ""}
          onValueChange={(v) => updateSearch({ actionType: v || "", page: 0 })}
          options={[
            { value: "", label: "Hành động" },
            { value: "ASSIGN_ROLE", label: "Gán vai trò" },
            { value: "CREATE_ROLE", label: "Tạo vai trò" },
            { value: "UPDATE_ROLE", label: "Cập nhật vai trò" },
            { value: "DELETE_ROLE", label: "Xóa vai trò" },
            { value: "ROLE_PERMISSIONS_REPLACED", label: "Thay đổi quyền" },
            { value: "MODULE_CREATED", label: "Tạo module" },
            { value: "PERMISSION_CREATED", label: "Tạo quyền" },
          ]}
        />
        <Input
          value={keyword}
          onChange={(e) => updateSearch({ keyword: e.target.value, page: 0 })}
          placeholder="Người thực hiện..."
          leftIcon={<Search className="h-4 w-4 text-text-tertiary" />}
        />
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => updateSearch({ keyword: "", fromDate: "", toDate: "", actionType: "", page: 0 })}>
          <RotateCcw className="h-4 w-4" /> Đặt lại
        </Button>
      </div>

      {/* Table */}
      <Table<AuditLogResponse>
        columns={columns}
        dataSource={data?.items ?? []}
        isLoading={isLoading}
        rowKey="id"
        onRowClick={(record: AuditLogResponse) => setSelectedLog(record)}
        pagination={buildPagination(page, pageSize, data?.totalElements ?? 0, (p) => updateSearch({ page: p }), (size) => updateSearch({ pageSize: size, page: 0 }))}
      />

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Chi tiết nhật ký"
        width={480}
      >
        {selectedLog && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ background: `${actionColor[selectedLog.action] || "#8792A2"}1a` }}>
                <Shield className="h-5 w-5" style={{ color: actionColor[selectedLog.action] || "#8792A2" }} />
              </div>
              <div>
                <span
                  className="inline-flex items-center rounded-full px-3 py-0.5 text-[12px] font-medium"
                  style={{ background: `${actionColor[selectedLog.action] || "#8792A2"}1a`, color: actionColor[selectedLog.action] || "#8792A2" }}
                >
                  {actionLabel[selectedLog.action] || selectedLog.action}
                </span>
                <p className="text-text-tertiary text-[12px] mt-0.5">
                  {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-btn p-3" style={{ background: "#101B2B" }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0" style={{ background: "rgba(0,174,239,0.15)" }}>
                <span className="text-[13px] font-bold" style={{ color: "#00AEEF" }}>{selectedLog.actorName?.charAt(0).toUpperCase() || "?"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-text-primary">{selectedLog.actorName || "Hệ thống"}</span>
                <span className="text-[11px] text-text-tertiary">Người thực hiện</span>
              </div>
            </div>

            <div className="rounded-btn p-3" style={{ background: "#101B2B" }}>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-tertiary">Đối tượng</span>
                  <span className="text-[13px] text-text-primary">{selectedLog.entityType}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-tertiary">ID</span>
                  <span className="text-[13px] font-mono text-text-primary">{selectedLog.entityId?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {selectedLog.newData && (
              <div className="rounded-btn p-3" style={{ background: "#101B2B" }}>
                <span className="text-[11px] text-text-tertiary font-medium">Dữ liệu thay đổi</span>
                <div className="flex flex-col gap-1.5 mt-2">
                  {Object.entries(selectedLog.newData).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[12px] text-text-tertiary min-w-20">{key}</span>
                      <span className="text-[12px] text-text-primary font-mono break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
