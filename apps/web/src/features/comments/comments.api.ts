import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CommentDto, Paginated } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';
import { socketService } from '@/lib/socket';

export function useTaskComments(taskId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    const handleCommentAdded = (data: { taskId: string; comment: CommentDto }) => {
      if (!mounted) return;
      if (data.taskId === taskId) {
        qc.invalidateQueries({ queryKey: keys.comments(taskId) });
      }
    };

    socketService.on('comment_added', handleCommentAdded);

    return () => {
      mounted = false;
      socketService.off('comment_added', handleCommentAdded);
    };
  }, [qc, taskId]);

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
