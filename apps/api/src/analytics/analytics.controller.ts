import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { User, UserRole } from '../users/user.entity';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: User) {
    return this.analyticsService.dashboard(user);
  }

  @Get('projects')
  projectSummaries(@CurrentUser() user: User) {
    return this.analyticsService.projectSummaries(user);
  }

  @Get('workload')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  workload(@CurrentUser() user: User) {
    return this.analyticsService.workload(user);
  }
}
