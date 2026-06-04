import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { Project } from '../projects/project.entity';
import { Task, TaskPriority, TaskStatus } from '../tasks/task.entity';
import { User, UserRole } from '../users/user.entity';
import { presentUser } from '../common/serializers/presenters';

@Injectable()
export class AnalyticsService {
  constructor(private readonly em: EntityManager) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  /**
   * Task query scope for the given user: elevated users (Admin/PM) see every
   * task, everyone else only tasks belonging to projects they're a member of.
   * Mirrors the scoping in {@link dashboard} so all analytics stay consistent.
   */
  private async taskScope(user: User): Promise<Record<string, unknown>> {
    if (this.isElevated(user)) return {};
    const projects = await this.em.find(Project, { members: user._id });
    return { project: { $in: projects.map((p) => p._id) } };
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

    const byPriority = {
      high: await this.em.count(Task, {
        ...taskScope,
        priority: TaskPriority.HIGH,
      }),
      medium: await this.em.count(Task, {
        ...taskScope,
        priority: TaskPriority.MEDIUM,
      }),
      low: await this.em.count(Task, {
        ...taskScope,
        priority: TaskPriority.LOW,
      }),
    };

    return {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatus: byStatus,
      tasksByPriority: byPriority,
    };
  }

  /**
   * Per-project progress summary: task counts and completion percentage for
   * each project the user can see. Powers the dashboard's "Project Summary"
   * section (e.g. "Website Redesign — 5 tasks pending", "Mobile App — 80%").
   * Scoped by role like {@link dashboard}: elevated users see every project,
   * others only the ones they're a member of.
   */
  async projectSummaries(user: User) {
    const projectFilter: Record<string, unknown> = this.isElevated(user)
      ? {}
      : { members: user._id };

    const projects = await this.em.find(Project, projectFilter, {
      orderBy: { deadline: 1, name: 1 },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return Promise.all(
      projects.map(async (project) => {
        const scope = { project: project._id };
        const [totalTasks, completedTasks, pendingTasks, overdueTasks] =
          await Promise.all([
            this.em.count(Task, scope),
            this.em.count(Task, { ...scope, status: TaskStatus.COMPLETED }),
            this.em.count(Task, {
              ...scope,
              status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
            }),
            this.em.count(Task, {
              ...scope,
              dueDate: { $lt: startOfToday },
              status: { $ne: TaskStatus.COMPLETED },
            }),
          ]);

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          deadline: project.deadline ? project.deadline.toISOString() : null,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionPct:
            totalTasks === 0
              ? 0
              : Math.round((completedTasks / totalTasks) * 100),
        };
      }),
    );
  }

  /**
   * Per-member workload summary: total / completed / pending task counts for
   * each active user. Restricted to Admin/PM at the controller layer; mirrors
   * the team roster (all active members) so the two views stay consistent.
   */
  async workload(_user: User) {
    const members = await this.em.find(
      User,
      { isActive: true },
      { orderBy: { name: 1 } },
    );

    const rows = await Promise.all(
      members.map(async (member) => {
        const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
          this.em.count(Task, { assignee: member._id }),
          this.em.count(Task, {
            assignee: member._id,
            status: TaskStatus.COMPLETED,
          }),
          this.em.count(Task, {
            assignee: member._id,
            status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
          }),
        ]);
        return {
          user: presentUser(member),
          totalTasks,
          completedTasks,
          pendingTasks,
        };
      }),
    );

    return rows;
  }

  /**
   * Cumulative "burn-up" trend over the last {@link weeks} weeks: at the end of
   * each week, how many tasks had been created vs. completed. Powers the
   * dashboard's "Project Progress Trend" line chart. Scoped by role like
   * {@link dashboard}.
   *
   * Note: there's no dedicated completedAt column, so a completed task's
   * `updatedAt` is used as an approximation of when it finished.
   */
  async progressTrend(user: User, weeks = 8) {
    const scope = await this.taskScope(user);
    const tasks = await this.em.find(Task, scope);

    const start = startOfToday();
    const points: { date: string; created: number; completed: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const cutoff = new Date(start);
      cutoff.setDate(cutoff.getDate() - i * 7);
      cutoff.setHours(23, 59, 59, 999);

      const created = tasks.filter((t) => t.createdAt <= cutoff).length;
      const completed = tasks.filter(
        (t) => t.status === TaskStatus.COMPLETED && t.updatedAt <= cutoff,
      ).length;

      points.push({ date: cutoff.toISOString(), created, completed });
    }

    return points;
  }

  /**
   * Tasks due within the next 7 days that aren't completed yet, soonest first.
   * Powers the dashboard's "Upcoming Deadlines" widget. Scoped by role.
   */
  async upcomingDeadlines(user: User, limit = 8) {
    const scope = await this.taskScope(user);

    const tasks = await this.em.find(
      Task,
      {
        ...scope,
        dueDate: { $gte: startOfToday(), $lte: inDays(7) },
        status: { $ne: TaskStatus.COMPLETED },
      },
      { populate: ['project', 'assignee'], orderBy: { dueDate: 1 }, limit },
    );

    return tasks.map(presentTaskBrief);
  }

  /**
   * Open high-priority tasks, ordered by nearest due date. Powers the
   * dashboard's "High Priority Tasks" widget. Scoped by role.
   */
  async highPriorityTasks(user: User, limit = 8) {
    const scope = await this.taskScope(user);

    const tasks = await this.em.find(
      Task,
      {
        ...scope,
        priority: TaskPriority.HIGH,
        status: { $ne: TaskStatus.COMPLETED },
      },
      {
        populate: ['project', 'assignee'],
        orderBy: { dueDate: 1, createdAt: -1 },
        limit,
      },
    );

    return tasks.map(presentTaskBrief);
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function inDays(days: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Compact task shape for dashboard list widgets (deadlines, high priority). */
function presentTaskBrief(task: Task) {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    projectId: task.project ? task.project.id : null,
    projectName: task.project ? task.project.name : null,
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name }
      : null,
  };
}
