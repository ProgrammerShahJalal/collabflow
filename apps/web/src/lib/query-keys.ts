export const keys = {
  projects: (filters?: object) => ['projects', filters ?? {}] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: (filters?: object) => ['tasks', filters ?? {}] as const,
  task: (id: string) => ['tasks', id] as const,
  users: (filters?: object) => ['users', filters ?? {}] as const,
  dashboard: () => ['analytics', 'dashboard'] as const,
  projectSummaries: () => ['analytics', 'projects'] as const,
  workload: () => ['analytics', 'workload'] as const,
  progressTrend: () => ['analytics', 'trend'] as const,
  upcomingDeadlines: () => ['analytics', 'upcoming'] as const,
  highPriorityTasks: () => ['analytics', 'high-priority'] as const,
  activities: (filters?: object) => ['activities', filters ?? {}] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  notifications: (filters?: object) =>
    ['notifications', filters ?? {}] as const,
  notificationsUnread: () => ['notifications', 'unread-count'] as const,
  me: () => ['auth', 'me'] as const,
};
