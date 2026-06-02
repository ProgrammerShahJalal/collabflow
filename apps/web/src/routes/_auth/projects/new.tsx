import { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useCreateProject } from '@/features/projects/projects.api';
import { useUsers } from '@/features/team/users.api';
import { apiErrorMessage } from '@/lib/api';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Textarea,
} from '@/components/ui';

export const Route = createFileRoute('/_auth/projects/new')({
  component: CreateProjectPage,
});

function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: users } = useUsers();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const toggleMember = (id: string) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (name.trim().length < 3) {
      setError('Project name must be at least 3 characters.');
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        memberIds,
      });
      toast.success('Project created');
      navigate({ to: '/projects/$id', params: { id: project.id } });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>
      <h1 className="text-2xl font-bold">Create Project</h1>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website Redesign"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional summary…"
            />
          </div>
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {users && users.length > 0 && (
            <div>
              <Label>Members</Label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      memberIds.includes(u.id)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                You are added automatically as the creator.
              </p>
            </div>
          )}

          <FieldError message={error} />
          <div className="flex gap-2">
            <Button type="submit" loading={createProject.isPending}>
              Create Project
            </Button>
            <Link to="/projects">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
