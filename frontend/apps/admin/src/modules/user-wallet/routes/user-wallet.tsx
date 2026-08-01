import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { UserWalletPage } from "../pages/user-wallet-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/user-wallet",
  component: UserWalletPage,
});
