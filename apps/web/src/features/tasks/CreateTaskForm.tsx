import { useState } from 'react';
import toast from 'react-hot-toast';
import type { UserDto } from '@collabflow/shared';
import { useCreateTask } from './tasks.api';
import { apiErrorMessage } from '@/lib/api';
import {
  Button,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui';

export function CreateTaskForm({
  projectId,
  members,
  onSuccess,
}: {
  projectId: string;
  members: UserDto[];
  onSuccess?: () => void;
}) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      await createTask.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        assigneeId: assigneeId || undefined,
      });
      toast.success('Task created');
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setAssigneeId('');
      onSuccess?.();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="t-title">Title</Label>
        <Input
          id="t-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Implement login screen"
          required
          minLength={2}
        />
      </div>
      <div>
        <Label htmlFor="t-desc">Description</Label>
        <Textarea
          id="t-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="t-due">Due date</Label>
          <Input
            id="t-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="t-priority">Priority</Label>
          <Select
            id="t-priority"
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
      <div>
        <Label htmlFor="t-assignee">Assignee</Label>
        <Select
          id="t-assignee"
          className="w-full"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>
      <FieldError message={error} />
      <Button type="submit" loading={createTask.isPending}>
        Add Task
      </Button>
    </form>
  );
}
