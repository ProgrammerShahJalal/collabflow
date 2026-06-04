import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  useDashboard,
  useProjectSummaries,
} from '@/features/dashboard/dashboard.api';
import { Badge, Card, EmptyState, Spinner } from '@/components/ui';
import { ActivityFeed } from '@/features/activities/ActivityFeed';
import { fromNow } from '@/lib/utils';

export const Route = createFileRoute('/_auth/')({
  component: DashboardPage,
});

const COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];

function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) return <Spinner />;

  const kpis = [
    { label: 'Projects', value: data.totalProjects, icon: FolderKanban, color: 'text-indigo-600' },
    { label: 'Total Tasks', value: data.totalTasks, icon: ListChecks, color: 'text-slate-600' },
    { label: 'Completed', value: data.completedTasks, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Pending', value: data.pendingTasks, icon: Clock, color: 'text-blue-600' },
    { label: 'Overdue', value: data.overdueTasks, icon: AlertTriangle, color: 'text-red-600' },
  ];

  const chartData = [
    { name: 'To Do', value: data.tasksByStatus.todo },
    { name: 'In Progress', value: data.tasksByStatus.in_progress },
    { name: 'Completed', value: data.tasksByStatus.completed },
  ];

  const hasTasks = data.totalTasks > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Task Status Distribution</h2>
          {hasTasks ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No tasks yet. Create a project and add tasks to see analytics.
            </p>
          )}
        </Card>

        <ProjectSummary />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <Link
            to="/activity"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View all
          </Link>
        </div>
        <ActivityFeed limit={5} />
      </Card>
    </div>
  );
}

function ProjectSummary() {
  const { data, isLoading } = useProjectSummaries();

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Project Summary</h2>
      {isLoading || !data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="Create a project to track its progress here."
        />
      ) : (
        <ul className="space-y-4">
          {data.map((p) => (
            <li key={p.id}>
              <Link
                to="/projects/$id"
                params={{ id: p.id }}
                className="block rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  <Badge value={p.status} />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${p.completionPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span>{summaryLine(p)}</span>
                  {p.deadline && (
                    <span
                      className={
                        p.overdueTasks > 0 ? 'text-red-600' : 'text-slate-400'
                      }
                    >
                      Deadline {fromNow(p.deadline)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function summaryLine(p: {
  totalTasks: number;
  pendingTasks: number;
  completionPct: number;
}): string {
  if (p.totalTasks === 0) return 'No tasks yet';
  if (p.pendingTasks === 0) return '100% completed';
  if (p.completionPct > 0) return `${p.completionPct}% completed`;
  return `${p.pendingTasks} task${p.pendingTasks === 1 ? '' : 's'} pending`;
}
