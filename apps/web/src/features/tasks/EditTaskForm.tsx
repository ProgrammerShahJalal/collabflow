import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TaskDto } from '@collabflow/shared';
import { useUpdateTask } from './tasks.api';
import { useProject } from '@/features/projects/projects.api';
import { apiErrorMessage } from '@/lib/api';
import {
  Button,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui';

export function EditTaskForm({
  task,
  onSuccess,
}: {
  task: TaskDto;
  onSuccess?: () => void;
}) {
  const projectId =
    typeof task.project === 'string' ? task.project : task.project.id;
  const update = useUpdateTask(task.id);
  const { data: project } = useProject(projectId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : '',
  );
  const [priority, setPriority] = useState<string>(task.priority);
  const [status, setStatus] = useState<string>(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '');
  const [error, setError] = useState<string>();

  // Ensure the current assignee is selectable even before members load.
  const memberOptions = useMemo(() => {
    const list = [...(project?.members ?? [])];
    if (task.assignee && !list.some((m) => m.id === task.assignee!.id)) {
      list.unshift(task.assignee);
    }
    return list;
  }, [project?.members, task.assignee]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      await update.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        status,
        assigneeId: assigneeId || null,
      });
      toast.success('Task updated');
      onSuccess?.();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="et-title">Title</Label>
        <Input
          id="et-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div>
        <Label htmlFor="et-desc">Description</Label>
        <Textarea
          id="et-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="et-due">Due date</Label>
          <Input
            id="et-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="et-priority">Priority</Label>
          <Select
            id="et-priority"
            className="w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="et-status">Status</Label>
          <Select
            id="et-status"
            className="w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="et-assignee">Assignee</Label>
          <Select
            id="et-assignee"
            className="w-full"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {memberOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <FieldError message={error} />
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" loading={update.isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
