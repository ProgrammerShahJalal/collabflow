import {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from './enums';

export interface BaseDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDto extends BaseDto {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
}

export interface ProjectDto extends BaseDto {
  name: string;
  description?: string | null;
  deadline?: string | null;
  status: ProjectStatus;
  createdBy: UserDto | string;
  members: UserDto[];
}

export interface TaskDto extends BaseDto {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project: ProjectDto | string;
  assignee?: UserDto | null;
  createdBy: UserDto | string;
  attachments: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface DashboardKpis {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface WorkloadRow {
  user: UserDto;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}
