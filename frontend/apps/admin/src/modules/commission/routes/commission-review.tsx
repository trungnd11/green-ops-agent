import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { CommissionReviewPage } from "../pages/commission-review-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/commission",
  component: CommissionReviewPage,
});
