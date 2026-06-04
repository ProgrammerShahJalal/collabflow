import { createFileRoute, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { useTask, useUpdateTask } from '@/features/tasks/tasks.api';
import { CommentSection } from '@/features/comments/CommentSection';
import { useAuthStore } from '@/stores/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { Badge, Card, Select, Spinner } from '@/components/ui';
import { formatDate, isOverdue } from '@/lib/utils';

export const Route = createFileRoute('/_auth/tasks/$id')({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { id } = Route.useParams();
  const user = useAuthStore((s) => s.user);
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask(id);

  if (isLoading || !task) return <Spinner />;

  const isElevated = user?.role === 'admin' || user?.role === 'project_manager';
  const isAssignee = task.assignee?.id === user?.id;
  const canEdit = isElevated || isAssignee;
  // Priority is an Admin/PM-only field; assignees may only change status.
  const canEditPriority = isElevated;

  const patch = async (field: string, value: string) => {
    try {
      await updateTask.mutateAsync({ [field]: value || null } as never);
      toast.success('Task updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const projectId =
    typeof task.project === 'string' ? task.project : task.project?.id;
  const projectName =
    typeof task.project === 'string' ? 'Project' : task.project?.name;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{task.title}</h1>
        {projectId && (
          <Link
            to="/projects/$id"
            params={{ id: projectId }}
            className="text-sm text-indigo-600 hover:underline"
          >
            in {projectName}
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {task.description || 'No description provided.'}
          </p>

          <h2 className="mb-2 mt-6 flex items-center gap-2 text-sm font-semibold uppercase text-slate-400">
            <Paperclip className="h-4 w-4" /> Attachments
          </h2>
          {task.attachments.length ? (
            <ul className="space-y-1 text-sm text-indigo-600">
              {task.attachments.map((a) => (
                <li key={a}>
                  <a href={a} target="_blank" rel="noreferrer" className="hover:underline">
                    {a.split('/').pop()}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No attachments.</p>
          )}
        </Card>

        <Card>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="mb-1 text-xs uppercase text-slate-400">Status</dt>
              <dd>
                {canEdit ? (
                  <Select
                    className="w-full"
                    value={task.status}
                    onChange={(e) => patch('status', e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </Select>
                ) : (
                  <Badge value={task.status} />
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs uppercase text-slate-400">Priority</dt>
              <dd>
                {canEditPriority ? (
                  <Select
                    className="w-full"
                    value={task.priority}
                    onChange={(e) => patch('priority', e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                ) : (
                  <Badge value={task.priority} />
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs uppercase text-slate-400">Due date</dt>
              <dd
                className={
                  isOverdue(task.dueDate, task.status)
                    ? 'font-medium text-red-600'
                    : ''
                }
              >
                {formatDate(task.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs uppercase text-slate-400">Assignee</dt>
              <dd>{task.assignee?.name ?? 'Unassigned'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <CommentSection taskId={id} />
    </div>
  );
}
