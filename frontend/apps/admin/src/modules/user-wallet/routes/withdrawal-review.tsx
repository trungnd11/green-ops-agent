import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { WithdrawalReviewPage } from "../pages/withdrawal-review-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/user-wallet/withdrawals",
  component: WithdrawalReviewPage,
});
