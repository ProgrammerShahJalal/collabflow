import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useUsers } from '@/features/team/users.api';
import { useWorkload } from '@/features/dashboard/dashboard.api';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { canManageProjects } from '@/lib/permissions';
import { Badge, Card, EmptyState, Spinner } from '@/components/ui';

export const Route = createFileRoute('/_auth/team')({
  component: TeamPage,
});

function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = canManageProjects(user);
  const { data: users, isLoading, isError } = useUsers();

  if (!canManage) {
    return (
      <EmptyState
        title="Restricted"
        hint="Only Admins and Project Managers can view the team roster."
      />
    );
  }

  return (
    <div className="space-y-8">
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

      <TeamProductivity enabled={canManage} />

      <WorkloadSummary enabled={canManage} />
    </div>
  );
}

function TeamProductivity({ enabled }: { enabled: boolean }) {
  const { data: rows, isLoading } = useWorkload(enabled);
  const isDark = useThemeStore((s) => s.theme === 'dark');

  // Recharts has no theme awareness, so axis labels render near-black on the
  // dark surface. Drive the tick / grid / tooltip colors off the app theme.
  const tickColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#e2e8f0' : '#0f172a',
  };

  const chartData = (rows ?? [])
    .filter((r) => r.totalTasks > 0)
    .map((r) => ({
      name: r.user.name,
      Completed: r.completedTasks,
      Pending: r.pendingTasks,
    }));

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Team Productivity Overview</h2>
        <p className="text-sm text-slate-500">
          Completed vs. pending tasks per member.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : chartData.length === 0 ? (
        <EmptyState title="No task assignments yet" />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: tickColor }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: tickColor }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.1)' }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: tickColor }}
            />
            <Legend />
            <Bar dataKey="Completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={64} />
            <Bar dataKey="Pending" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function WorkloadSummary({ enabled }: { enabled: boolean }) {
  const { data: rows, isLoading } = useWorkload(enabled);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Workload Summary</h2>
        <p className="text-sm text-slate-500">
          Tasks assigned to each member across all projects.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !rows?.length ? (
        <EmptyState title="No workload data" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3 text-center">Total Tasks</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.user.id}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/tasks"
                      search={{ assigneeId: row.user.id }}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {row.user.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.user.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {row.user.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {row.totalTasks}
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">
                    {row.completedTasks}
                  </td>
                  <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">
                    {row.pendingTasks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
