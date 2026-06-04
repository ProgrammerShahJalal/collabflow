import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  Flame,
} from 'lucide-react';
import type { TaskBriefRow } from '@collabflow/shared';
import {
  useDashboard,
  useHighPriorityTasks,
  useProgressTrend,
  useProjectSummaries,
  useUpcomingDeadlines,
} from '@/features/dashboard/dashboard.api';
import { Badge, Card, EmptyState, Spinner } from '@/components/ui';
import { ActivityFeed } from '@/features/activities/ActivityFeed';
import { useThemeStore } from '@/stores/theme.store';
import { fromNow } from '@/lib/utils';

export const Route = createFileRoute('/_auth/')({
  component: DashboardPage,
});

const STATUS_COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];
const PRIORITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#94a3b8',
};

function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const isDark = useThemeStore((s) => s.theme === 'dark');

  // Recharts has no theme awareness, so the default tooltip renders a near-white
  // title on its light surface. Drive the tooltip colors off the app theme.
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#e2e8f0' : '#0f172a',
  };
  const tooltipLabelStyle = { color: isDark ? '#cbd5e1' : '#475569' };
  const tooltipItemStyle = { color: isDark ? '#e2e8f0' : '#0f172a' };

  if (isLoading || !data) return <Spinner />;

  const kpis = [
    { label: 'Projects', value: data.totalProjects, icon: FolderKanban, color: 'text-indigo-600' },
    { label: 'Total Tasks', value: data.totalTasks, icon: ListChecks, color: 'text-slate-600' },
    { label: 'Completed', value: data.completedTasks, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Pending', value: data.pendingTasks, icon: Clock, color: 'text-blue-600' },
    { label: 'Overdue', value: data.overdueTasks, icon: AlertTriangle, color: 'text-red-600' },
  ];

  const statusData = [
    { name: 'To Do', value: data.tasksByStatus.todo },
    { name: 'In Progress', value: data.tasksByStatus.in_progress },
    { name: 'Completed', value: data.tasksByStatus.completed },
  ];

  const priorityData = [
    { name: 'High', value: data.tasksByPriority.high },
    { name: 'Medium', value: data.tasksByPriority.medium },
    { name: 'Low', value: data.tasksByPriority.low },
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
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No tasks yet. Create a project and add tasks to see analytics.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Tasks by Priority</h2>
          {hasTasks ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {priorityData.map((d) => (
                    <Cell key={d.name} fill={PRIORITY_COLORS[d.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No tasks yet.
            </p>
          )}
        </Card>
      </div>

      <ProgressTrend />

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskListWidget
          title="Upcoming Deadlines"
          icon={CalendarClock}
          iconColor="text-amber-600"
          query={useUpcomingDeadlines}
          emptyTitle="Nothing upcoming"
          emptyHint="Tasks due within the next 7 days will appear here."
          viewAllSearch={{ deadlineStatus: 'upcoming' }}
        />
        <TaskListWidget
          title="High Priority Tasks"
          icon={Flame}
          iconColor="text-red-600"
          query={useHighPriorityTasks}
          emptyTitle="No high priority tasks"
          emptyHint="Open high-priority tasks will appear here."
          viewAllSearch={{ priority: 'high' }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectSummary />
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
    </div>
  );
}

function ProgressTrend() {
  const { data, isLoading } = useProgressTrend();
  const isDark = useThemeStore((s) => s.theme === 'dark');

  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#e2e8f0' : '#0f172a',
  };
  const tooltipLabelStyle = { color: isDark ? '#cbd5e1' : '#475569' };

  const chartData = (data ?? []).map((p) => ({
    label: format(new Date(p.date), 'MMM d'),
    Created: p.created,
    Completed: p.completed,
  }));

  const hasData = chartData.some((p) => p.Created > 0);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Project Progress Trend</h2>
      {isLoading ? (
        <Spinner />
      ) : !hasData ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No task history yet. Trends appear as tasks are created and completed.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Legend />
            <Area
              type="monotone"
              dataKey="Created"
              stroke="#6366f1"
              fill="url(#created)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Completed"
              stroke="#22c55e"
              fill="url(#completed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function TaskListWidget({
  title,
  icon: Icon,
  iconColor,
  query,
  emptyTitle,
  emptyHint,
  viewAllSearch,
}: {
  title: string;
  icon: typeof CalendarClock;
  iconColor: string;
  query: () => { data?: TaskBriefRow[]; isLoading: boolean };
  emptyTitle: string;
  emptyHint: string;
  viewAllSearch: Record<string, string>;
}) {
  const { data, isLoading } = query();

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </h2>
        <Link
          to="/tasks"
          search={viewAllSearch}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          View all
        </Link>
      </div>
      {isLoading || !data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <EmptyState title={emptyTitle} hint={emptyHint} />
      ) : (
        <ul className="space-y-2">
          {data.map((t) => (
            <li key={t.id}>
              <Link
                to="/projects/$id"
                params={{ id: t.projectId ?? '' }}
                className="block rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{t.title}</span>
                  <Badge value={t.priority} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">
                    {t.projectName ?? 'No project'}
                    {t.assignee ? ` · ${t.assignee.name}` : ''}
                  </span>
                  {t.dueDate && (
                    <span className="shrink-0 text-slate-400">
                      Due {fromNow(t.dueDate)}
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
