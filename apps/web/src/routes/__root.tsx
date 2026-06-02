import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { useAuthStore } from '@/stores/auth.store';

export interface RouterContext {
  queryClient: QueryClient;
  auth: ReturnType<typeof useAuthStore.getState>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
