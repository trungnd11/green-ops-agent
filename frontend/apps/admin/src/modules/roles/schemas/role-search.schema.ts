import { z } from "zod";

export const roleSearchSchema = z.object({
  page: z.number().min(0).optional().default(0),
  pageSize: z.number().min(5).max(100).optional().default(10),
  keyword: z.string().optional().default(""),
});

export type RoleSearchParams = z.infer<typeof roleSearchSchema>;
