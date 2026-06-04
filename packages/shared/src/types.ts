import {
  ActivityType,
  NotificationType,
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

export interface CommentDto extends BaseDto {
  body: string;
  author: UserDto;
  taskId: string;
}

export interface NotificationDto extends BaseDto {
  type: NotificationType;
  message: string;
  actor?: UserDto | null;
  read: boolean;
  taskId?: string | null;
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
  tasksByStatus: { todo: number; in_progress: number; completed: number };
  tasksByPriority: { high: number; medium: number; low: number };
}

export interface ProgressTrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface TaskBriefRow {
  id: string;
  title: string;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  projectId?: string | null;
  projectName?: string | null;
  assignee?: { id: string; name: string } | null;
}

export interface WorkloadRow {
  user: UserDto;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface ActivityDto extends BaseDto {
  type: ActivityType;
  message: string;
  actor?: UserDto | null;
  projectId?: string | null;
  projectName?: string | null;
}

export interface ProjectSummaryRow {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline?: string | null;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPct: number;
}
