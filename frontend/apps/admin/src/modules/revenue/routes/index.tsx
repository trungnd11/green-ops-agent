import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { RevenueListPage } from "../pages/revenue-list-page";

const revenueSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(20),
  keyword: z.string().catch(""),
  status: z.enum(["all", "draft", "locked", "settled", "closed"]).catch("all"),
});

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/revenues",
  validateSearch: revenueSearchSchema,
  component: RevenueListPage,
});
