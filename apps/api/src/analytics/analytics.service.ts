import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { Project } from '../projects/project.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(private readonly em: EntityManager) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  async dashboard(user: User) {
    const projectFilter: Record<string, unknown> = this.isElevated(user)
      ? {}
      : { members: user._id };

    const projects = await this.em.find(Project, projectFilter);
    const projectIds = projects.map((p) => p._id);
    const taskScope = this.isElevated(user)
      ? {}
      : { project: { $in: projectIds } };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalTasks, completedTasks, pendingTasks, overdueTasks] =
      await Promise.all([
        this.em.count(Task, taskScope),
        this.em.count(Task, { ...taskScope, status: TaskStatus.COMPLETED }),
        this.em.count(Task, {
          ...taskScope,
          status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        }),
        this.em.count(Task, {
          ...taskScope,
          dueDate: { $lt: startOfToday },
          status: { $ne: TaskStatus.COMPLETED },
        }),
      ]);

    const byStatus = {
      todo: await this.em.count(Task, { ...taskScope, status: TaskStatus.TODO }),
      in_progress: await this.em.count(Task, {
        ...taskScope,
        status: TaskStatus.IN_PROGRESS,
      }),
      completed: completedTasks,
    };

    return {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatus: byStatus,
    };
  }
}
