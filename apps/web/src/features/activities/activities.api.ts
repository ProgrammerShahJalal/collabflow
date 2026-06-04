import { useQuery } from '@tanstack/react-query';
import type { ActivityDto, Paginated } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export interface ActivityFilters {
  projectId?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: keys.activities(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ActivityDto>>('/activities', {
        params: filters,
      });
      return data;
    },
  });
}
