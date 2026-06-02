import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useProject, useUpdateProject } from '@/features/projects/projects.api';
import { apiErrorMessage } from '@/lib/api';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';

export const Route = createFileRoute('/_auth/projects/$id/edit')({
  component: EditProjectPage,
});

function EditProjectPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setDeadline(project.deadline ? project.deadline.slice(0, 10) : '');
      setStatus(project.status);
    }
  }, [project]);

  if (isLoading || !project) return <Spinner />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      await updateProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        status,
      });
      toast.success('Project updated');
      navigate({ to: '/projects/$id', params: { id } });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/projects/$id"
        params={{ id }}
        className="inline-flex items-center gap-1 text-sm text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back to project
      </Link>
      <h1 className="text-2xl font-bold">Edit Project</h1>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                className="w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>
          <FieldError message={error} />
          <Button type="submit" loading={updateProject.isPending}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
