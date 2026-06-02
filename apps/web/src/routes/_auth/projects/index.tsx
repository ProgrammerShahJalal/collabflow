import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Search, Users } from 'lucide-react';
import type { ProjectDto } from '@collabflow/shared';
import { useProjects } from '@/features/projects/projects.api';
import { useAuthStore } from '@/stores/auth.store';
import { canManageProjects } from '@/lib/permissions';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_auth/projects/')({
  component: ProjectListPage,
});

function ProjectListPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useProjects({
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        {canManageProjects(user) && (
          <Link to="/projects/new">
            <Button>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <EmptyState title="No projects found" hint="Create your first project to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectDto }) {
  return (
    <Link to="/projects/$id" params={{ id: project.id }}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{project.name}</h3>
          <Badge value={project.status} />
        </div>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {project.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {project.members.length} members
          </span>
          <span>Due {formatDate(project.deadline)}</span>
        </div>
      </Card>
    </Link>
  );
}
