import { User } from '../../users/user.entity';
import { Project } from '../../projects/project.entity';
import { Task } from '../../tasks/task.entity';
import { Activity } from '../../activities/activity.entity';

export interface UserView {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function presentUser(user: User): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl ?? null,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function presentProject(project: Project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    deadline: project.deadline ? project.deadline.toISOString() : null,
    status: project.status,
    createdBy: presentUser(project.createdBy),
    members: project.members.isInitialized()
      ? project.members.getItems().map(presentUser)
      : [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function presentActivity(activity: Activity) {
  return {
    id: activity.id,
    type: activity.type,
    message: activity.message,
    actor: activity.actor ? presentUser(activity.actor) : null,
    projectId: activity.projectId ?? null,
    projectName: activity.projectName ?? null,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  };
}

export function presentTask(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    status: task.status,
    priority: task.priority,
    project: task.project
      ? { id: task.project.id, name: task.project.name }
      : null,
    assignee: task.assignee ? presentUser(task.assignee) : null,
    createdBy: presentUser(task.createdBy),
    attachments: task.attachments ?? [],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
