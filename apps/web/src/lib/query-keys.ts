export const keys = {
  projects: (filters?: object) => ['projects', filters ?? {}] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: (filters?: object) => ['tasks', filters ?? {}] as const,
  task: (id: string) => ['tasks', id] as const,
  users: (filters?: object) => ['users', filters ?? {}] as const,
  dashboard: () => ['analytics', 'dashboard'] as const,
  projectSummaries: () => ['analytics', 'projects'] as const,
  workload: () => ['analytics', 'workload'] as const,
  activities: (filters?: object) => ['activities', filters ?? {}] as const,
  me: () => ['auth', 'me'] as const,
};
