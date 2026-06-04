import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Activity, ActivityType } from './activity.entity';
import { Project } from '../projects/project.entity';
import { User, UserRole } from '../users/user.entity';
import { ActivityQueryDto } from './dto/activity.dto';
import { paginate } from '../common/dto/pagination.dto';

export interface RecordActivityInput {
  type: ActivityType;
  message: string;
  actor?: User;
  /** Project the activity relates to. Pass id/name directly for deleted projects. */
  project?: { id: string; name: string };
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: EntityRepository<Activity>,
    private readonly em: EntityManager,
  ) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  /**
   * Persist an activity entry. Called from other services after their own
   * unit of work has flushed, so this only writes the new record. Failures are
   * swallowed: logging an activity must never break the user's actual action.
   */
  async record(input: RecordActivityInput): Promise<void> {
    try {
      const activity = this.repo.create({
        type: input.type,
        message: input.message,
        actor: input.actor,
        projectId: input.project?.id,
        projectName: input.project?.name,
      });
      await this.em.persistAndFlush(activity);
    } catch {
      // Activity logging is best-effort and must not surface to the caller.
    }
  }

  async findAll(query: ActivityQueryDto, user: User) {
    const where: Record<string, unknown> = {};

    // Team members only see activity for projects they belong to.
    if (!this.isElevated(user)) {
      const projects = await this.em.find(Project, { members: user._id });
      where.projectId = { $in: projects.map((p) => p.id) };
    }

    if (query.projectId) where.projectId = query.projectId;
    if (query.type) where.type = query.type;

    const [items, total] = await this.repo.findAndCount(where, {
      populate: ['actor'],
      orderBy: { createdAt: -1 },
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return paginate(items, total, query.page, query.limit);
  }
}
