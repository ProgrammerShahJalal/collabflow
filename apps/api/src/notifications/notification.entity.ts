import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

// Mirrors NotificationType in @collabflow/shared. Kept as a local enum (same
// pattern as ActivityType in activity.entity.ts) so the entity layer does not
// depend on the web/shared package at runtime.
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  DEADLINE_SOON = 'deadline_soon',
}

@Entity()
export class Notification extends BaseEntity {
  @Enum(() => NotificationType)
  type!: NotificationType;

  /** Pre-rendered, human-readable line shown in the notification list. */
  @Property()
  message!: string;

  @ManyToOne(() => User)
  @Index()
  recipient!: User;

  @ManyToOne(() => User, { nullable: true })
  actor?: User;

  @Property({ default: false })
  read = false;

  // Deep-link target. Stored as a plain id (not a relation) so the notification
  // survives the task being deleted; the client only needs it to navigate.
  @Property({ nullable: true })
  taskId?: string;
}
