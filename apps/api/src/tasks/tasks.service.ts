import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { paginate } from '../common/dto/pagination.dto';

const SORTABLE = new Set([
  'createdAt',
  'updatedAt',
  'dueDate',
  'priority',
  'title',
]);

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: EntityRepository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: EntityRepository<Project>,
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
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
      attachments: [],
    });

    await this.em.persistAndFlush(task);
    await this.em.populate(task, ['assignee', 'project', 'createdBy']);
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
    return task;
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id, user);
    this.assertCanModify(task, user);
    task.status = status;
    await this.em.flush();
    await this.em.populate(task, ['assignee', 'project', 'createdBy']);
    return task;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    if (!this.isElevated(user)) {
      throw new ForbiddenException('Only Admin or PM can delete tasks.');
    }
    await this.em.removeAndFlush(task);
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
