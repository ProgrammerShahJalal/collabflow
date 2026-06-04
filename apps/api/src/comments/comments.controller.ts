import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { presentComment } from '../common/serializers/presenters';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async findAll(
    @Param('taskId') taskId: string,
    @Query() query: CommentQueryDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.commentsService.findByTask(taskId, query, user);
    return { data: result.data.map(presentComment), meta: result.meta };
  }

  @Post()
  async create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return presentComment(
      await this.commentsService.create(taskId, dto, user),
    );
  }

  // Permission (author or Admin/PM) is enforced in the service.
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return presentComment(await this.commentsService.update(id, dto, user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.commentsService.remove(id, user);
    return { success: true };
  }
}
