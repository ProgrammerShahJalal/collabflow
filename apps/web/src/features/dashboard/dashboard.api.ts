import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByStatus: { todo: number; in_progress: number; completed: number };
}

export function useDashboard() {
  return useQuery({
    queryKey: keys.dashboard(),
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/analytics/dashboard');
      return data;
    },
  });
}
