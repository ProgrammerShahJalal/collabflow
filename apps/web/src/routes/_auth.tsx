import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
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
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
