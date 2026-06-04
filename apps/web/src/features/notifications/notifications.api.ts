import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { NotificationDto, Paginated } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications(),
    queryFn: async () => {
      const { data } = await api.get<Paginated<NotificationDto>>(
        '/notifications',
        { params: { limit: 20 } },
      );
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.notificationsUnread(),
    // Poll so the badge stays roughly live without a websocket layer.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        '/notifications/unread-count',
      );
      return data.count;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<NotificationDto>(
        `/notifications/${id}/read`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
