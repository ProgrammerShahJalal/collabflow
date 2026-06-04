import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CommentDto, Paginated } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: keys.comments(taskId),
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get<Paginated<CommentDto>>(
        `/tasks/${taskId}/comments`,
        { params: { limit: 100, sortOrder: 'asc' } },
      );
      return data;
    },
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<CommentDto>(
        `/tasks/${taskId}/comments`,
        { body },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(taskId) });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await api.patch<CommentDto>(
        `/tasks/${taskId}/comments/${id}`,
        { body },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${taskId}/comments/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.comments(taskId) });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
