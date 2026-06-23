import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Paginated, TaskDto } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';
import { socketService } from '@/lib/socket';

export interface TaskFilters {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  deadlineStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useTasks(filters: TaskFilters = {}) {
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    const handleTaskCreated = (data: { projectId: string; task: TaskDto }) => {
      if (!mounted) return;
      if (!filters.projectId || filters.projectId === data.projectId) {
        qc.invalidateQueries({ queryKey: keys.tasks(filters) });
      }
    };

    const handleTaskUpdated = (data: { projectId: string; task: TaskDto }) => {
      if (!mounted) return;
      if (!filters.projectId || filters.projectId === data.projectId) {
        qc.invalidateQueries({ queryKey: keys.tasks(filters) });
      }
    };

    socketService.on('task_created', handleTaskCreated);
    socketService.on('task_updated', handleTaskUpdated);

    return () => {
      mounted = false;
      socketService.off('task_created', handleTaskCreated);
      socketService.off('task_updated', handleTaskUpdated);
    };
  }, [qc, JSON.stringify(filters)]);

  return useQuery({
    queryKey: keys.tasks(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<TaskDto>>('/tasks', {
        params: filters,
      });
      return data;
    },
  });
}

export function useTask(id: string) {
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    const handleTaskUpdated = (data: { projectId: string; task: TaskDto }) => {
      if (!mounted) return;
      if (data.task.id === id) {
        qc.setQueryData(keys.task(id), data.task);
      }
    };

    socketService.on('task_updated', handleTaskUpdated);

    return () => {
      mounted = false;
      socketService.off('task_updated', handleTaskUpdated);
    };
  }, [qc, id]);

  return useQuery({
    queryKey: keys.task(id),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<TaskDto>(`/tasks/${id}`);
      return data;
    },
  });
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  projectId: string;
  assigneeId?: string;
  attachments?: string[];
}

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

/** Upload one or more files and return their public URLs + metadata. */
export function useUploadFiles() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      const { data } = await api.post<UploadedFile[]>('/uploads', form);
      return data;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data } = await api.post<TaskDto>('/tasks', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<Omit<CreateTaskInput, 'assigneeId'>> & {
        assigneeId?: string | null;
      },
    ) => {
      const { data } = await api.patch<TaskDto>(`/tasks/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: keys.task(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<TaskDto>(`/tasks/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: keys.task(task.id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export interface BulkTaskInput {
  taskIds: string[];
  action: 'update_status' | 'delete';
  status?: string;
}

export interface BulkTaskResult {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}

export function useBulkTaskAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkTaskInput) => {
      const { data } = await api.post<BulkTaskResult>('/tasks/bulk', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
