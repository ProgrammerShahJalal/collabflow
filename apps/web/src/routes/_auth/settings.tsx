import { createFileRoute } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Badge, Button, Card, Label } from '@/components/ui';

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">Name</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Role</dt>
            <dd>{user && <Badge value={user.role} />}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Label>Appearance</Label>
            <p className="text-sm text-slate-400">
              Currently using {theme} mode.
            </p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" /> Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" /> Dark
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
