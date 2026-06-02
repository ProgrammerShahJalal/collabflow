import { Entity, Enum, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '../common/entities/base.entity';

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_MEMBER = 'team_member',
}

@Entity()
export class User extends BaseEntity {
  @Property()
  @Index()
  name!: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  passwordHash!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.TEAM_MEMBER;

  @Property({ default: true })
  isActive = true;

  @Property({ nullable: true })
  avatarUrl?: string;

  @Property({ nullable: true })
  lastLoginAt?: Date;

  /** Hashed refresh token (rotated per /auth/refresh). Never exposed. */
  @Property({ hidden: true, nullable: true })
  refreshTokenHash?: string;
}
