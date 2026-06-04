import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { presentNotification } from '../common/serializers/presenters';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.notificationsService.findForUser(query, user);
    return { data: result.data.map(presentNotification), meta: result.meta };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: User) {
    return { count: await this.notificationsService.unreadCount(user) };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return presentNotification(
      await this.notificationsService.markRead(id, user),
    );
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllRead(user);
    return { success: true };
  }
}
