import { AppProviders } from './providers';
import type { router } from './router';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <AppProviders />;
}
