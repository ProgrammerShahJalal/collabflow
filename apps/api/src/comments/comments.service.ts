import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Comment } from './comment.entity';
import { Task } from '../tasks/task.entity';
import { User, UserRole } from '../users/user.entity';
import { TasksService } from '../tasks/tasks.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/activity.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { paginate } from '../common/dto/pagination.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { presentComment } from '../common/serializers/presenters';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly repo: EntityRepository<Comment>,
    private readonly em: EntityManager,
    private readonly tasksService: TasksService,
    private readonly activities: ActivitiesService,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  private isElevated(user: User): boolean {
    return (
      user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER
    );
  }

  async create(
    taskId: string,
    dto: CreateCommentDto,
    user: User,
  ): Promise<Comment> {
    // Reuse the task access check so comment visibility can never diverge from
    // task visibility. Throws Forbidden/NotFound as appropriate.
    const task = await this.tasksService.findOne(taskId, user);

    const comment = this.repo.create({
      body: dto.body,
      task,
      author: user,
    });
    await this.em.persistAndFlush(comment);
    await this.em.populate(comment, ['author']);

    await this.activities.record({
      type: ActivityType.TASK_COMMENTED,
      message: `${user.name} commented on "${task.title}"`,
      actor: user,
      project: task.project,
    });

    await this.notifications.dispatch({
      type: NotificationType.COMMENT_ADDED,
      message: `${user.name} commented on "${task.title}"`,
      recipients: await this.resolveRecipients(task, user),
      actor: user,
      taskId: task.id,
    });

    // Real-time update for the task's comment section
    try {
      const recipients = await this.resolveRecipients(task, user);
      const recipientIds = recipients.map((r) => r.id);
      this.gateway.sendToMultipleUsers(recipientIds, 'comment_added', {
        taskId: task.id,
        comment: presentComment(comment),
      });
    } catch (error: any) {
      this.logger.error(`Failed to emit real-time comment: ${error.message}`);
    }

    return comment;
  }

  /**
   * Recipients of a new comment: the task assignee, the task creator, and every
   * prior commenter — excluding the person who just commented.
   */
  private async resolveRecipients(task: Task, author: User): Promise<User[]> {
    const recipients: User[] = [];
    if (task.assignee) recipients.push(task.assignee);
    if (task.createdBy) recipients.push(task.createdBy);

    const priorComments = await this.repo.find(
      { task: task._id },
      { populate: ['author'] },
    );
    for (const c of priorComments) {
      if (c.author) recipients.push(c.author);
    }

    return recipients.filter((u) => u.id !== author.id);
  }

  async findByTask(taskId: string, query: CommentQueryDto, user: User) {
    const task = await this.tasksService.findOne(taskId, user);

    const [items, total] = await this.repo.findAndCount(
      { task: task._id },
      {
        populate: ['author'],
        orderBy: { createdAt: 1 },
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
      },
    );

    return paginate(items, total, query.page, query.limit);
  }

  private async loadOrFail(id: string): Promise<Comment> {
    const comment = await this.repo.findOne({ id }, { populate: ['author'] });
    if (!comment) throw new NotFoundException('Comment not found.');
    return comment;
  }

  /** Only the comment's author or an Admin/PM may edit or delete it. */
  private assertCanModify(comment: Comment, user: User): void {
    if (this.isElevated(user)) return;
    if (comment.author?.id === user.id) return;
    throw new ForbiddenException('You can only modify your own comments.');
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    user: User,
  ): Promise<Comment> {
    const comment = await this.loadOrFail(id);
    this.assertCanModify(comment, user);
    comment.body = dto.body;
    await this.em.flush();
    return comment;
  }

  async remove(id: string, user: User): Promise<void> {
    const comment = await this.loadOrFail(id);
    this.assertCanModify(comment, user);
    await this.em.removeAndFlush(comment);
  }
}
