import { useQuery } from '@tanstack/react-query';
import type {
  ProgressTrendPoint,
  ProjectSummaryRow,
  TaskBriefRow,
  WorkloadRow,
} from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksByStatus: { todo: number; in_progress: number; completed: number };
  tasksByPriority: { high: number; medium: number; low: number };
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

export function useProjectSummaries() {
  return useQuery({
    queryKey: keys.projectSummaries(),
    queryFn: async () => {
      const { data } = await api.get<ProjectSummaryRow[]>('/analytics/projects');
      return data;
    },
  });
}

export function useWorkload(enabled = true) {
  return useQuery({
    queryKey: keys.workload(),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<WorkloadRow[]>('/analytics/workload');
      return data;
    },
  });
}

export function useProgressTrend() {
  return useQuery({
    queryKey: keys.progressTrend(),
    queryFn: async () => {
      const { data } = await api.get<ProgressTrendPoint[]>('/analytics/trend');
      return data;
    },
  });
}

export function useUpcomingDeadlines() {
  return useQuery({
    queryKey: keys.upcomingDeadlines(),
    queryFn: async () => {
      const { data } = await api.get<TaskBriefRow[]>('/analytics/upcoming');
      return data;
    },
  });
}

export function useHighPriorityTasks() {
  return useQuery({
    queryKey: keys.highPriorityTasks(),
    queryFn: async () => {
      const { data } = await api.get<TaskBriefRow[]>('/analytics/high-priority');
      return data;
    },
  });
}
