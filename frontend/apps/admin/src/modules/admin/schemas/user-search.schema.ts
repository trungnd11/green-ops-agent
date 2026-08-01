import { z } from "zod";

export const userSearchSchema = z.object({
  page: z.number().min(0).optional().default(0),
  pageSize: z.number().min(5).max(100).optional().default(10),
  keyword: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

export type UserSearchParams = z.infer<typeof userSearchSchema>;
