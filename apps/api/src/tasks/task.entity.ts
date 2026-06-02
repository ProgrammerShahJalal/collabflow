import {
  Entity,
  Enum,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity()
@Unique({ properties: ['project', 'title'] })
export class Task extends BaseEntity {
  @Property()
  title!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ nullable: true })
  dueDate?: Date;

  @Enum(() => TaskStatus)
  status: TaskStatus = TaskStatus.TODO;

  @Enum(() => TaskPriority)
  priority: TaskPriority = TaskPriority.MEDIUM;

  @ManyToOne(() => Project)
  project!: Project;

  @ManyToOne(() => User, { nullable: true })
  assignee?: User;

  @ManyToOne(() => User)
  createdBy!: User;

  @Property({ type: 'array' })
  attachments: string[] = [];
}
