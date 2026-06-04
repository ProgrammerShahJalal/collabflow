import { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, UserPlus, X } from 'lucide-react';
import {
  useAddMember,
  useDeleteProject,
  useProject,
  useRemoveMember,
} from '@/features/projects/projects.api';
import { useTasks } from '@/features/tasks/tasks.api';
import { useUsers } from '@/features/team/users.api';
import { TaskTable } from '@/features/tasks/TaskTable';
import { CreateTaskForm } from '@/features/tasks/CreateTaskForm';
import { useAuthStore } from '@/stores/auth.store';
import { canDeleteProjects, canManageTasks, canManageProjects } from '@/lib/permissions';
import { apiErrorMessage } from '@/lib/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_auth/projects/$id/')({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: project, isLoading } = useProject(id);
  const { data: tasks } = useTasks({ projectId: id, limit: 100 });
  const deleteProject = useDeleteProject();
  const [showTaskForm, setShowTaskForm] = useState(false);

  if (isLoading || !project) return <Spinner />;

  const members = project.members ?? [];

  const handleDelete = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject.mutateAsync(id);
      toast.success('Project deleted');
      navigate({ to: '/projects' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge value={project.status} />
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {project.description}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Deadline: {formatDate(project.deadline)}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageProjects(user) && (
            <Link to="/projects/$id/edit" params={{ id }}>
              <Button variant="outline">Edit</Button>
            </Link>
          )}
          {canDeleteProjects(user) && (
            <Button variant="danger" onClick={handleDelete} loading={deleteProject.isPending}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks</h2>
            {canManageTasks(user) && (
              <Button variant="outline" onClick={() => setShowTaskForm((v) => !v)}>
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            )}
          </div>

          {showTaskForm && canManageTasks(user) && (
            <Card>
              <CreateTaskForm
                projectId={id}
                members={members}
                onSuccess={() => setShowTaskForm(false)}
              />
            </Card>
          )}

          {!tasks?.data.length ? (
            <EmptyState title="No tasks yet" hint="Add the first task to this project." />
          ) : (
            <TaskTable tasks={tasks.data} />
          )}
        </div>

        <MembersPanel projectId={id} members={members} creatorId={
          typeof project.createdBy === 'string' ? project.createdBy : project.createdBy.id
        } />
      </div>
    </div>
  );
}

function MembersPanel({
  projectId,
  members,
  creatorId,
}: {
  projectId: string;
  members: { id: string; name: string; email: string }[];
  creatorId: string;
}) {
  const user = useAuthStore((s) => s.user);
  const { data: allUsers } = useUsers();
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const [pick, setPick] = useState('');

  const canManage = canManageProjects(user);
  const memberIds = new Set(members.map((m) => m.id));
  const candidates = (allUsers ?? []).filter((u) => !memberIds.has(u.id));

  const add = async () => {
    if (!pick) return;
    try {
      await addMember.mutateAsync(pick);
      setPick('');
      toast.success('Member added');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async (uid: string) => {
    try {
      await removeMember.mutateAsync(uid);
      toast.success('Member removed');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">Team</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-slate-400">{m.email}</p>
              </div>
            </div>
            {canManage && m.id !== creatorId && (
              <button
                onClick={() => remove(m.id)}
                className="text-slate-400 hover:text-red-500"
                aria-label="Remove member"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canManage && candidates.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Select
            className="flex-1"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">Add member…</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Button onClick={add} loading={addMember.isPending}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
