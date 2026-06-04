import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { ActivityQueryDto } from './dto/activity.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { presentActivity } from '../common/serializers/presenters';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(@Query() query: ActivityQueryDto, @CurrentUser() user: User) {
    const result = await this.activitiesService.findAll(query, user);
    return { data: result.data.map(presentActivity), meta: result.meta };
  }
}
