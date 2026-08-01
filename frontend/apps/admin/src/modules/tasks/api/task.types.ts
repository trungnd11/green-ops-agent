export interface AdminTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assigneeId?: string;
  assigneeName?: string;
  referenceType?: string;
  referenceId?: string;
  dueDate?: string;
  createdByName: string;
  createdAt: string;
}
