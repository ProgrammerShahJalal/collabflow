import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { NotificationDto, Paginated } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';
import { socketService } from '@/lib/socket';

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
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    const handleNotification = (notification: NotificationDto) => {
      if (!mounted) return;
      // Update unread count
      qc.setQueryData(keys.notificationsUnread(), (old: number | undefined) => (old ?? 0) + 1);
      // Update notifications list if cached
      qc.invalidateQueries({ queryKey: keys.notifications() });
      // Show toast
      toast.success(notification.message);
    };

    socketService.on('notification', handleNotification);
    return () => {
      mounted = false;
      socketService.off('notification', handleNotification);
    };
  }, [qc]);

  return useQuery({
    queryKey: keys.notificationsUnread(),
    // Polling kept as fallback but at a longer interval
    refetchInterval: 60_000,
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
