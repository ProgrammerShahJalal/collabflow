import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Paginated, ProjectDto } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';

export interface ProjectFilters {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: keys.projects(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ProjectDto>>('/projects', {
        params: filters,
      });
      return data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: keys.project(id),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ProjectDto>(`/projects/${id}`);
      return data;
    },
  });
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  deadline?: string;
  memberIds?: string[];
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await api.post<ProjectDto>('/projects', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateProjectInput> & { status?: string }) => {
      const { data } = await api.patch<ProjectDto>(`/projects/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<ProjectDto>(
        `/projects/${projectId}/members`,
        { userId },
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.project(projectId) }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.project(projectId) }),
  });
}
