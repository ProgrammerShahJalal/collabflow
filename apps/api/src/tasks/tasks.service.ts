import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { Project } from '../projects/project.entity';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import {
  BulkTaskAction,
  BulkTaskActionDto,
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { paginate } from '../common/dto/pagination.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/activity.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { presentTask } from '../common/serializers/presenters';

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.COMPLETED]: 'Completed',
};

const SORTABLE = new Set([
  'createdAt',
  'updatedAt',
  'dueDate',
  'priority',
  'title',
]);

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly repo: EntityRepository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: EntityRepository<Project>,
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly activities: ActivitiesService,
    private readonly gateway: NotificationsGateway,
  ) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  private async loadProjectOrFail(projectId: string): Promise<Project> {
    const project = await this.projectRepo.findOne(
      { id: projectId },
      { populate: ['members'] },
    );
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  private assertAssigneeIsMember(project: Project, assigneeId: string): User {
    const member = project.members
      .getItems()
      .find((m) => m.id === assigneeId);
    if (!member) {
      throw new UnprocessableEntityException(
        'Assignee must be a member of this project.',
      );
    }
    return member;
  }

  private assertFutureDate(dueDate?: string): void {
    if (!dueDate) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (new Date(dueDate) < start) {
      throw new BadRequestException('Please select a valid deadline.');
    }
  }

  async create(dto: CreateTaskDto, user: User): Promise<Task> {
    const project = await this.loadProjectOrFail(dto.projectId);

    // Rule 1: duplicate title within the same project.
    const duplicate = await this.repo.findOne({
      project: project._id,
      title: dto.title,
    });
    if (duplicate) {
      throw new ConflictException('This task already exists in the project.');
    }

    // Rule 2: due date cannot be in the past.
    this.assertFutureDate(dto.dueDate);

    // Rule 3: assignee must be a project member.
    let assignee: User | undefined;
    if (dto.assigneeId) {
      assignee = this.assertAssigneeIsMember(project, dto.assigneeId);
    }

    const task = this.repo.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: dto.status ?? TaskStatus.TODO,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      project,
      assignee,
      createdBy: user,
      attachments: dto.attachments ?? [],
    });

    await this.em.persistAndFlush(task);
    await this.em.populate(task, ['assignee', 'project', 'createdBy']);

    await this.activities.record({
      type: ActivityType.TASK_CREATED,
      message: assignee
        ? `${user.name} created task "${task.title}" and assigned it to ${assignee.name}`
        : `${user.name} created task "${task.title}" in "${project.name}"`,
      actor: user,
      project,
    });

    // Notify project members about new task
    try {
      await this.em.populate(project, ['members']);
      const projectMembers = project.members.getItems();
      const memberIds = projectMembers.map((m) => m.id);
      this.gateway.sendToMultipleUsers(memberIds, 'task_created', {
        projectId: project.id,
        task: presentTask(task),
      });
    } catch (error: any) {
      this.logger.error(`Failed to emit task_created event: ${error.message}`);
    }

    return task;
  }

  async findAll(query: TaskQueryDto, user: User) {
    const where: Record<string, unknown> = {};

    if (query.projectId) {
      const project = await this.loadProjectOrFail(query.projectId);
      this.assertProjectAccess(project, user);
      where.project = project._id;
    } else if (!this.isElevated(user)) {
      // Team members: restrict to tasks in their projects.
      const projects = await this.projectRepo.find({ members: user._id });
      where.project = { $in: projects.map((p) => p._id) };
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) {
      const assignee = await this.usersService.findByIdOrFail(query.assigneeId);
      where.assignee = assignee._id;
    }

    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      where.$or = [{ title: rx }, { description: rx }];
    }

    if (query.deadlineStatus === 'overdue') {
      where.dueDate = { $lt: startOfToday() };
      where.status = { $ne: TaskStatus.COMPLETED };
    } else if (query.deadlineStatus === 'upcoming') {
      where.dueDate = { $gte: startOfToday(), $lte: inDays(7) };
    }

    const orderBy = {
      [SORTABLE.has(query.sortBy) ? query.sortBy : 'createdAt']:
        query.sortOrder === 'asc' ? 1 : -1,
    } as Record<string, 1 | -1>;

    const [items, total] = await this.repo.findAndCount(where, {
      populate: ['assignee', 'project', 'createdBy'],
      orderBy,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.repo.findOne(
      { id },
      { populate: ['assignee', 'project.members', 'createdBy'] },
    );
    if (!task) throw new NotFoundException('Task not found.');
    this.assertProjectAccess(task.project, user);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    this.assertCanModify(task, user);

    const prevStatus = task.status;
    const prevAssigneeId = task.assignee?.id ?? null;

    // Rule: only Admin/PM may change priority. Team members may update their
    // assigned tasks (e.g. status) but not re-prioritise them.
    if (
      dto.priority !== undefined &&
      dto.priority !== task.priority &&
      !this.isElevated(user)
    ) {
      throw new ForbiddenException(
        'Only Admin or Project Manager can change task priority.',
      );
    }

    // Rule 4: completed tasks cannot be reassigned.
    if (
      task.status === TaskStatus.COMPLETED &&
      dto.assigneeId !== undefined &&
      dto.assigneeId !== (task.assignee?.id ?? null)
    ) {
      throw new BadRequestException('Completed tasks cannot be reassigned.');
    }

    // Rule 2: due date cannot be in the past.
    this.assertFutureDate(dto.dueDate);

    if (dto.title !== undefined && dto.title !== task.title) {
      const duplicate = await this.repo.findOne({
        project: task.project._id,
        title: dto.title,
        id: { $ne: id },
      });
      if (duplicate) {
        throw new ConflictException('This task already exists in the project.');
      }
      task.title = dto.title;
    }

    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.attachments !== undefined) task.attachments = dto.attachments;
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    }

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId === null || dto.assigneeId === '') {
        task.assignee = undefined;
      } else {
        // Rule 3: assignee must be a project member.
        task.assignee = this.assertAssigneeIsMember(
          task.project,
          dto.assigneeId,
        );
      }
    }

    await this.em.flush();
    await this.em.populate(task, ['assignee', 'project', 'createdBy']);

    const newAssigneeId = task.assignee?.id ?? null;
    if (task.status !== prevStatus || newAssigneeId !== prevAssigneeId) {
      try {
        await this.em.populate(task.project, ['members']);
        const projectMembers = task.project.members.getItems();
        const memberIds = projectMembers.map((m) => m.id);
        this.gateway.sendToMultipleUsers(memberIds, 'task_updated', {
          projectId: task.project.id,
          task: presentTask(task),
        });
      } catch (error: any) {
        this.logger.error(`Failed to emit task_updated event: ${error.message}`);
      }
    }

    if (task.status !== prevStatus) {
      await this.activities.record({
        type: ActivityType.TASK_STATUS_CHANGED,
        message: `${user.name} marked "${task.title}" as ${STATUS_LABELS[task.status]}`,
        actor: user,
        project: task.project,
      });
    }

    if (newAssigneeId !== prevAssigneeId) {
      await this.activities.record({
        type: ActivityType.TASK_ASSIGNED,
        message: task.assignee
          ? `${user.name} assigned "${task.title}" to ${task.assignee.name}`
          : `${user.name} unassigned "${task.title}"`,
        actor: user,
        project: task.project,
      });
    }

    return task;
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id, user);
    this.assertCanModify(task, user);
    const prevStatus = task.status;
    task.status = status;
    await this.em.flush();
    await this.em.populate(task, ['assignee', 'project', 'createdBy']);

    if (task.status !== prevStatus) {
      await this.activities.record({
        type: ActivityType.TASK_STATUS_CHANGED,
        message: `${user.name} marked "${task.title}" as ${STATUS_LABELS[task.status]}`,
        actor: user,
        project: task.project,
      });
    }

    return task;
  }

  /**
   * Apply a single action (status change or delete) to many tasks. Each item is
   * processed through the same per-task path as the single-item endpoints, so
   * permission checks and activity logging stay identical. Failures are
   * collected per-task rather than aborting the whole batch.
   */
  async bulkAction(dto: BulkTaskActionDto, user: User) {
    if (dto.action === BulkTaskAction.UPDATE_STATUS && !dto.status) {
      throw new BadRequestException(
        'A target status is required to update tasks.',
      );
    }

    const ids = [...new Set(dto.taskIds)];
    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];

    for (const id of ids) {
      try {
        if (dto.action === BulkTaskAction.UPDATE_STATUS) {
          await this.updateStatus(id, dto.status!, user);
        } else {
          await this.remove(id, user);
        }
        succeeded.push(id);
      } catch (err) {
        failed.push({
          id,
          reason: err instanceof Error ? err.message : 'Action failed.',
        });
      }
    }

    return { succeeded, failed };
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    if (!this.isElevated(user)) {
      throw new ForbiddenException('Only Admin or PM can delete tasks.');
    }
    const taskRef = { title: task.title, project: task.project };
    await this.em.removeAndFlush(task);

    await this.activities.record({
      type: ActivityType.TASK_DELETED,
      message: `${user.name} deleted task "${taskRef.title}"`,
      actor: user,
      project: taskRef.project,
    });
  }

  private assertProjectAccess(project: Project, user: User): void {
    if (this.isElevated(user)) return;
    const isMember = project.members.isInitialized()
      ? project.members.getItems().some((m) => m.id === user.id)
      : false;
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this task.');
    }
  }

  /** Ownership check: team members may only modify tasks assigned to them. */
  private assertCanModify(task: Task, user: User): void {
    if (this.isElevated(user)) return;
    if (task.assignee?.id === user.id) return;
    throw new ForbiddenException('You can only update tasks assigned to you.');
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function inDays(days: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + days);
  return d;
}
