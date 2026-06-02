import { createFileRoute } from '@tanstack/react-router';
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
import { useDashboard } from '@/features/dashboard/dashboard.api';
import { Card, Spinner } from '@/components/ui';

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

      <Card className="max-w-lg">
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
    </div>
  );
}
