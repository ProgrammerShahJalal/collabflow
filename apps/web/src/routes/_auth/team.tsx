import { createFileRoute } from '@tanstack/react-router';
import { useUsers } from '@/features/team/users.api';
import { useAuthStore } from '@/stores/auth.store';
import { canManageProjects } from '@/lib/permissions';
import { Badge, Card, EmptyState, Spinner } from '@/components/ui';

export const Route = createFileRoute('/_auth/team')({
  component: TeamPage,
});

function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const { data: users, isLoading, isError } = useUsers();

  if (!canManageProjects(user)) {
    return (
      <EmptyState
        title="Restricted"
        hint="Only Admins and Project Managers can view the team roster."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>
      {isLoading ? (
        <Spinner />
      ) : isError || !users?.length ? (
        <EmptyState title="No team members found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="mt-3">
                <Badge value={u.role} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
