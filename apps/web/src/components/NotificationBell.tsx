import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Bell, CheckCheck } from 'lucide-react';
import type { NotificationDto } from '@collabflow/shared';
import { Button } from './ui';
import { fromNow } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/notifications.api';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: unread = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onItemClick = async (n: NotificationDto) => {
    if (!n.read) {
      try {
        await markRead.mutateAsync(n.id);
      } catch {
        // Non-fatal — navigation still proceeds.
      }
    }
    setOpen(false);
    if (n.taskId) navigate({ to: '/tasks/$id', params: { id: n.taskId } });
  };

  const notifications = data?.data ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Notifications
            </span>
            {unread > 0 && (
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => markAllRead.mutate()}
                loading={markAllRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                You're all caught up.
              </p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      )}
                      <span
                        className={n.read ? 'min-w-0 flex-1 pl-4' : 'min-w-0 flex-1'}
                      >
                        <span className="block text-sm text-slate-700 dark:text-slate-200">
                          {n.message}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {fromNow(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
