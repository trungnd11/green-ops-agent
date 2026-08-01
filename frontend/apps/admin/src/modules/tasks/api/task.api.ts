import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { AdminTask } from "./task.types";

export type { AdminTask };

export async function fetchTasks(status = "all", page = 0, size = 20): Promise<LegacyPageResponse<AdminTask>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<AdminTask>>>("/tasks", { status, page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách công việc");
  return res.data;
}

export async function updateTaskStatus(id: string, status: string): Promise<void> {
  const res = await httpClient.patch<ApiResponse<void>>(`/tasks/${id}/status`, { status });
  if (!res.success) throw new Error(res.message || "Cập nhật thất bại");
}
