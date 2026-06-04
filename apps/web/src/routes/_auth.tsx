import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { useMe } from '@/features/auth/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  // Hydrate the current user from the token. `user` lives only in memory, so on
  // a page reload (or after switching accounts) it must be refetched from
  // `/auth/me` — otherwise role-scoped UI renders with a stale/null user.
  const { isLoading } = useMe();
  const user = useAuthStore((s) => s.user);

  if (!user && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
