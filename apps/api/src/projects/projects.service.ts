import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Project, ProjectStatus } from './project.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import {
  AddMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { paginate } from '../common/dto/pagination.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/activity.entity';

const SORTABLE = new Set(['createdAt', 'updatedAt', 'name', 'deadline']);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: EntityRepository<Project>,
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly activities: ActivitiesService,
  ) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  async create(dto: CreateProjectDto, creator: User): Promise<Project> {
    // Rule: project name unique per organisation (case-insensitive).
    const clash = await this.repo.findOne({
      name: new RegExp(`^${escapeRegex(dto.name)}$`, 'i'),
    });
    if (clash) {
      throw new ConflictException('A project with this name already exists.');
    }

    const project = this.repo.create({
      name: dto.name,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: dto.status ?? ProjectStatus.ACTIVE,
      createdBy: creator,
    });

    // Members always include the creator.
    const memberIds = new Set(dto.memberIds ?? []);
    memberIds.add(creator.id);
    const members = await this.usersService.findManyByIds([...memberIds]);
    project.members.set(members.length ? members : [creator]);

    await this.em.persistAndFlush(project);

    await this.activities.record({
      type: ActivityType.PROJECT_CREATED,
      message: `${creator.name} created project "${project.name}"`,
      actor: creator,
      project,
    });

    return project;
  }

  async findAll(query: ProjectQueryDto, user: User) {
    const where: Record<string, unknown> = {};

    // Team members only see projects they belong to.
    if (!this.isElevated(user)) {
      where.members = user._id;
    }

    if (query.status) where.status = query.status;

    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      where.$or = [{ name: rx }, { description: rx }];
    }

    if (query.deadlineStatus === 'overdue') {
      where.deadline = { $lt: startOfToday() };
    } else if (query.deadlineStatus === 'upcoming') {
      where.deadline = { $gte: startOfToday(), $lte: inDays(7) };
    }

    const orderBy = {
      [SORTABLE.has(query.sortBy) ? query.sortBy : 'createdAt']:
        query.sortOrder === 'asc' ? 1 : -1,
    } as Record<string, 1 | -1>;

    const [items, total] = await this.repo.findAndCount(where, {
      populate: ['members', 'createdBy'],
      orderBy,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.repo.findOne(
      { id },
      { populate: ['members', 'createdBy'] },
    );
    if (!project) throw new NotFoundException('Project not found.');
    this.assertAccess(project, user);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: User): Promise<Project> {
    const project = await this.findOne(id, user);
    this.assertCanManage(project, user);

    if (dto.name && dto.name.toLowerCase() !== project.name.toLowerCase()) {
      const clash = await this.repo.findOne({
        name: new RegExp(`^${escapeRegex(dto.name)}$`, 'i'),
        id: { $ne: id },
      });
      if (clash) {
        throw new ConflictException('A project with this name already exists.');
      }
      project.name = dto.name;
    }

    if (dto.description !== undefined) project.description = dto.description;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.deadline !== undefined) {
      project.deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    }

    await this.em.flush();
    return project;
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.repo.findOne({ id });
    if (!project) throw new NotFoundException('Project not found.');
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only an admin can delete a project.');
    }

    // Capture identity before the entity is removed from the unit of work.
    const projectRef = { id: project.id, name: project.name };

    // Cascade: delete all tasks belonging to the project.
    await this.em.nativeDelete(Task, { project: project._id });
    await this.em.removeAndFlush(project);

    await this.activities.record({
      type: ActivityType.PROJECT_DELETED,
      message: `${user.name} deleted project "${projectRef.name}"`,
      actor: user,
      project: projectRef,
    });
  }

  async addMember(id: string, dto: AddMemberDto, user: User): Promise<Project> {
    const project = await this.findOne(id, user);
    this.assertCanManage(project, user);

    const newMember = await this.usersService.findByIdOrFail(dto.userId);
    if (project.members.getItems().some((m) => m.id === newMember.id)) {
      throw new ConflictException('User is already a project member.');
    }
    project.members.add(newMember);
    await this.em.flush();

    await this.activities.record({
      type: ActivityType.MEMBER_ADDED,
      message: `${user.name} added ${newMember.name} to "${project.name}"`,
      actor: user,
      project,
    });

    return project;
  }

  async removeMember(id: string, uid: string, user: User): Promise<Project> {
    const project = await this.findOne(id, user);
    this.assertCanManage(project, user);

    const member = project.members.getItems().find((m) => m.id === uid);
    if (!member) {
      throw new NotFoundException('User is not a member of this project.');
    }
    if (member.id === project.createdBy.id) {
      throw new BadRequestException('The project creator cannot be removed.');
    }

    // Rule: cannot remove a member with open (non-completed) assigned tasks.
    const openTasks = await this.em.count(Task, {
      project: project._id,
      assignee: member._id,
      status: { $ne: TaskStatus.COMPLETED },
    });
    if (openTasks > 0) {
      throw new BadRequestException(
        'This member has open tasks. Reassign them before removing.',
      );
    }

    project.members.remove(member);
    await this.em.flush();

    await this.activities.record({
      type: ActivityType.MEMBER_REMOVED,
      message: `${user.name} removed ${member.name} from "${project.name}"`,
      actor: user,
      project,
    });

    return project;
  }

  private assertAccess(project: Project, user: User): void {
    if (this.isElevated(user)) return;
    const isMember = project.members.getItems().some((m) => m.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project.');
    }
  }

  private assertCanManage(project: Project, user: User): void {
    if (user.role === UserRole.ADMIN) return;
    if (
      user.role === UserRole.PROJECT_MANAGER &&
      project.createdBy.id === user.id
    ) {
      return;
    }
    // PMs may also manage projects they are a member of.
    if (
      user.role === UserRole.PROJECT_MANAGER &&
      project.members.getItems().some((m) => m.id === user.id)
    ) {
      return;
    }
    throw new ForbiddenException(
      'You do not have permission to manage this project.',
    );
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
