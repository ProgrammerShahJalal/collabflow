import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

@Entity()
export class Comment extends BaseEntity {
  @Property()
  body!: string;

  @ManyToOne(() => Task)
  @Index()
  task!: Task;

  @ManyToOne(() => User)
  author!: User;
}
