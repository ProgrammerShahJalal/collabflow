import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useTasks } from '@/features/tasks/tasks.api';
import { TaskTable } from '@/features/tasks/TaskTable';
import { EmptyState, Input, Select, Spinner } from '@/components/ui';

export const Route = createFileRoute('/_auth/tasks/')({
  component: AllTasksPage,
});

function AllTasksPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { data, isLoading } = useTasks({
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Tasks</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <EmptyState title="No tasks found" />
      ) : (
        <TaskTable tasks={data.data} />
      )}
    </div>
  );
}
