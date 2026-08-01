import { z } from "zod";

export const auditLogSearchSchema = z.object({
  page: z.number().min(0).optional().default(0),
  pageSize: z.number().min(5).max(100).optional().default(10),
  keyword: z.string().optional().default(""),
  actionType: z.string().optional().default(""),
  fromDate: z.string().optional().default(""),
  toDate: z.string().optional().default(""),
});

export type AuditLogSearchParams = z.infer<typeof auditLogSearchSchema>;
