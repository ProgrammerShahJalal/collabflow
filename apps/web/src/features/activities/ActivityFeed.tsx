import type { ComponentType } from 'react';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  FolderPlus,
  ListPlus,
  MessageSquare,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { ActivityType, type ActivityDto } from '@collabflow/shared';
import { EmptyState, Pagination, Spinner } from '@/components/ui';
import { fromNow } from '@/lib/utils';
import { useActivities } from './activities.api';

const ICONS: Record<
  ActivityType,
  { icon: ComponentType<{ className?: string }>; color: string }
> = {
  [ActivityType.PROJECT_CREATED]: { icon: FolderPlus, color: 'text-indigo-600' },
  [ActivityType.PROJECT_UPDATED]: { icon: FolderPlus, color: 'text-indigo-600' },
  [ActivityType.PROJECT_DELETED]: { icon: Trash2, color: 'text-red-600' },
  [ActivityType.TASK_CREATED]: { icon: ListPlus, color: 'text-blue-600' },
  [ActivityType.TASK_ASSIGNED]: { icon: UserPlus, color: 'text-blue-600' },
  [ActivityType.TASK_STATUS_CHANGED]: {
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  [ActivityType.TASK_DELETED]: { icon: Trash2, color: 'text-red-600' },
  [ActivityType.TASK_COMMENTED]: {
    icon: MessageSquare,
    color: 'text-indigo-600',
  },
  [ActivityType.MEMBER_ADDED]: { icon: UserPlus, color: 'text-emerald-600' },
  [ActivityType.MEMBER_REMOVED]: { icon: UserMinus, color: 'text-amber-600' },
};

function ActivityRow({ activity }: { activity: ActivityDto }) {
  const { icon: Icon, color } = ICONS[activity.type] ?? {
    icon: ActivityIcon,
    color: 'text-slate-500',
  };
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Icon className={`h-4 w-4 ${color}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          {activity.message}
        </p>
        <p className="text-xs text-slate-400">{fromNow(activity.createdAt)}</p>
      </div>
    </li>
  );
}

export function ActivityFeed({
  limit = 10,
  page,
  onPageChange,
  onLimitChange,
}: {
  limit?: number;
  /** When provided (with onPageChange), the feed renders a pager. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** When provided, the pager shows a "Per page" selector. */
  onLimitChange?: (limit: number) => void;
}) {
  const { data, isLoading } = useActivities({ limit, page });

  if (isLoading || !data) return <Spinner />;
  if (data.data.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        hint="Actions across projects and tasks will show up here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {data.data.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </ul>
      {onPageChange && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={onPageChange}
          perPage={onLimitChange ? limit : undefined}
          onPerPageChange={onLimitChange}
        />
      )}
    </div>
  );
}
