import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/mongodb';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const email = data.email.toLowerCase().trim();
    const existing = await this.repo.findOne({ email });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const user = this.repo.create({
      name: data.name,
      email,
      passwordHash: await bcrypt.hash(data.password, SALT_ROUNDS),
      role: data.role ?? UserRole.TEAM_MEMBER,
      isActive: true,
    });
    await this.em.persistAndFlush(user);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ email: email.toLowerCase().trim() });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.repo.findOne({ id });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) return [];
    return this.repo.find({ id: { $in: ids } });
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async setLastLogin(user: User): Promise<void> {
    user.lastLoginAt = new Date();
    await this.em.flush();
  }

  async setRefreshTokenHash(user: User, token: string | null): Promise<void> {
    user.refreshTokenHash = token
      ? await bcrypt.hash(token, SALT_ROUNDS)
      : undefined;
    await this.em.flush();
  }

  async matchesRefreshToken(user: User, token: string): Promise<boolean> {
    if (!user.refreshTokenHash) return false;
    return bcrypt.compare(token, user.refreshTokenHash);
  }
}
