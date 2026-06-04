import { useQuery } from '@tanstack/react-query';
import type { UserDto } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export function useUsers(search?: string, enabled = true) {
  return useQuery({
    queryKey: keys.users({ search }),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<UserDto[]>('/users', {
        params: search ? { search } : undefined,
      });
      return data;
    },
  });
}
