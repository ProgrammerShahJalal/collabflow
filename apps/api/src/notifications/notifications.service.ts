import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';
import { NotificationQueryDto } from './dto/notification.dto';
import { paginate } from '../common/dto/pagination.dto';
import { NotificationsGateway } from './notifications.gateway';
import { presentNotification } from '../common/serializers/presenters';

export interface DispatchNotificationInput {
  type: NotificationType;
  message: string;
  /** Users to notify. Empty/duplicate-free not required — handled here. */
  recipients: User[];
  actor?: User;
  taskId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: EntityRepository<Notification>,
    private readonly em: EntityManager,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Fan a notification out to many recipients. Called from other services after
   * their own unit of work has flushed. Best-effort: a failure here must never
   * break the user's actual action (mirrors ActivitiesService.record).
   */
  async dispatch(input: DispatchNotificationInput): Promise<void> {
    try {
      const seen = new Set<string>();
      const createdNotifications: Notification[] = [];

      for (const recipient of input.recipients) {
        if (!recipient || seen.has(recipient.id)) continue;
        seen.add(recipient.id);
        const notification = this.repo.create({
          type: input.type,
          message: input.message,
          recipient,
          actor: input.actor,
          taskId: input.taskId,
          read: false,
        });
        this.em.persist(notification);
        createdNotifications.push(notification);
      }
      await this.em.flush();

      // Emit real-time notifications via WebSocket
      if (createdNotifications.length > 0) {
        await this.em.populate(createdNotifications, ['actor']);
      }

      for (const notification of createdNotifications) {
        try {
          this.gateway.sendToUser(
            notification.recipient.id,
            'notification',
            presentNotification(notification),
          );
        } catch (error) {
          this.logger.error(
            `Failed to emit real-time notification to user ${notification.recipient.id}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      // Notifications are best-effort and must not surface to the caller.
      this.logger.error(`Failed to dispatch notifications: ${error.message}`);
    }
  }

  async findForUser(query: NotificationQueryDto, user: User) {
    const where: Record<string, unknown> = { recipient: user._id };
    if (query.unreadOnly) where.read = false;

    const [items, total] = await this.repo.findAndCount(where, {
      populate: ['actor'],
      orderBy: { createdAt: -1 },
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    return paginate(items, total, query.page, query.limit);
  }

  async unreadCount(user: User): Promise<number> {
    return this.repo.count({ recipient: user._id, read: false });
  }

  async markRead(id: string, user: User): Promise<Notification> {
    const notification = await this.repo.findOne({
      id,
      recipient: user._id,
    });
    if (!notification) throw new NotFoundException('Notification not found.');
    if (!notification.read) {
      notification.read = true;
      await this.em.flush();
    }
    await this.em.populate(notification, ['actor']);
    return notification;
  }

  async markAllRead(user: User): Promise<void> {
    await this.repo.nativeUpdate(
      { recipient: user._id, read: false },
      { read: true },
    );
  }
}
