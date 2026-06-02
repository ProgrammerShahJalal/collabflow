import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EntityRepository } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User, UserRole } from './user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { presentUser } from '../common/serializers/presenters';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
  ) {}

  // Admin + PM so member-pickers in the project UI can resolve users.
  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async findAll(@Query('role') role?: UserRole, @Query('search') search?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (role) where.role = role;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      where.$or = [{ name: rx }, { email: rx }];
    }
    const users = await this.repo.find(where, { orderBy: { name: 1 }, limit: 100 });
    return users.map(presentUser);
  }
}
