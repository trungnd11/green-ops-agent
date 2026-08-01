import { z } from "zod";

export const driverSearchSchema = z.object({
  page: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(10).max(100).catch(20),
  keyword: z.string().optional().default(""),
  status: z.enum(["all", "active", "inactive", "blocked", "pending_verification"]).catch("all"),
});

export type DriverSearchParams = z.infer<typeof driverSearchSchema>;
