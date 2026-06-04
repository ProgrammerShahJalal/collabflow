import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Paginated, TaskDto } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

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
    },
  });
}
