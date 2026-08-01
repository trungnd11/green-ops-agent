import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { SettlementDetailPage } from "../pages/settlement-detail-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settlements/$id",
  component: SettlementDetailPage,
});
