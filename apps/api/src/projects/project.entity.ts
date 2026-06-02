import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

@Entity()
export class Project extends BaseEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ nullable: true })
  deadline?: Date;

  @Enum(() => ProjectStatus)
  status: ProjectStatus = ProjectStatus.ACTIVE;

  @ManyToOne(() => User)
  createdBy!: User;

  @ManyToMany(() => User)
  members = new Collection<User>(this);
}
