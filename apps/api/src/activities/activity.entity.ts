import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

export enum ActivityType {
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_DELETED = 'task_deleted',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
}

@Entity()
export class Activity extends BaseEntity {
  @Enum(() => ActivityType)
  type!: ActivityType;

  /** Pre-rendered, human-readable line shown in the activity feed. */
  @Property()
  message!: string;

  @ManyToOne(() => User, { nullable: true })
  actor?: User;

  // Project is stored denormalised (id + name) rather than as a relation so the
  // log survives the project being deleted, and so feed scoping stays a cheap
  // `$in` lookup without populating a possibly-dangling reference.
  @Property({ nullable: true })
  @Index()
  projectId?: string;

  @Property({ nullable: true })
  projectName?: string;
}
