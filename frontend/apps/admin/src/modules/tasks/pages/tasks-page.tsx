import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, RotateCcw, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@xanh/ui";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Select } from "@xanh/ui/select";
import { buildPagination } from "@/shared/utils/pagination";
import { StatsCard } from "@/shared/components/StatsCard";
import { useTaskList, useUpdateTaskStatus } from "../api/task.queries";
import { formatDateTime } from "@xanh/utils";
import type { AdminTask } from "../api/task.types";

const PRIORITY_VARIANT: Record<string, string> = {
  high: "error",
  medium: "warning",
  low: "default",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang làm",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
};

export function TasksPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("pending");
  const [searchStatus, setSearchStatus] = useState("pending");

  const { data, isFetching } = useTaskList(searchStatus, page);
  const updateMut = useUpdateTaskStatus();

  const items = data?.items || [];
  const stats = {
    pending: items.filter((i) => i.status === "pending").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
    done: items.filter((i) => i.status === "done").length,
  };

  const handleSearch = useCallback(() => {
    setSearchStatus(status);
    setPage(0);
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus("pending");
    setSearchStatus("pending");
    setPage(0);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-2xl font-bold" style={{ fontFamily: "Manrope" }}>
          Việc cần xử lý
        </h1>
        <p className="text-text-secondary text-[13px]">Danh sách các công việc cần xử lý</p>
      </div>

      <div className="flex gap-4">
        <StatsCard icon={AlertTriangle} label="Chờ xử lý" value={stats.pending} color="#F59E0B" />
        <StatsCard icon={RefreshCw} label="Đang làm" value={stats.inProgress} color="#38BDF8" />
        <StatsCard icon={CheckCircle} label="Hoàn thành" value={stats.done} color="#22C55E" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <p className="text-xs text-text-secondary mb-1">Trạng thái</p>
          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "in_progress", label: "Đang làm" },
              { value: "done", label: "Hoàn thành" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
          />
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="primary" leftIcon={<Search className="h-4 w-4" />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button variant="secondary" className="text-text-tertiary" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      </div>

      <Table<AdminTask>
        dataSource={items}
        isLoading={isFetching}
        rowKey="id"
        autoHeight
        columns={[
          { title: "Công việc", render: (_, r) => (
              <div>
                <p className="font-medium">{r.title}</p>
                {r.description && <p className="text-xs text-text-tertiary">{r.description}</p>}
              </div>
            ),
          },
          {
            title: "Mức độ",
            render: (_, r) => (
              <Badge variant={PRIORITY_VARIANT[r.priority] as any}>{PRIORITY_LABEL[r.priority]}</Badge>
            ),
          },
          { title: "Người xử lý", render: (_, r) => r.assigneeName || "—" },
          { title: "Hạn", render: (_, r) => r.dueDate || "—" },
          {
            title: "Trạng thái",
            render: (_, r) => (
              <Badge variant={r.status === "done" ? "success" : r.status === "cancelled" ? "error" : "warning" as any}>
                {STATUS_LABEL[r.status] || r.status}
              </Badge>
            ),
          },
          {
            title: "",
            render: (_, r) => r.status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => updateMut.mutate({ id: r.id, status: "in_progress" })}>
                  Nhận làm
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateMut.mutate({ id: r.id, status: "cancelled" })}>
                  Hủy
                </Button>
              </div>
            ) : r.status === "in_progress" ? (
              <Button size="sm" variant="primary" onClick={() => updateMut.mutate({ id: r.id, status: "done" })}>
                Hoàn thành
              </Button>
            ) : null,
          },
        ]}
        pagination={buildPagination(
          page,
          20,
          data?.totalElements ?? 0,
          (p: number) => setPage(p),
          () => {}
        )}
      />
    </div>
  );
}
