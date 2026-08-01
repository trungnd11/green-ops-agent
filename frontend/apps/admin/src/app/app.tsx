import { AppProviders } from "./providers";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof import("./router").router;
  }
}

export function App() {
  return <AppProviders />;
}
