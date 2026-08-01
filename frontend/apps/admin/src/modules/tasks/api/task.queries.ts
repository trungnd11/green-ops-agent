import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, updateTaskStatus } from "./task.api";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (status: string, page: number) => [...taskKeys.all, "list", status, page] as const,
};

export function useTaskList(status = "all", page = 0) {
  return useQuery({
    queryKey: taskKeys.list(status, page),
    queryFn: () => fetchTasks(status, page),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
