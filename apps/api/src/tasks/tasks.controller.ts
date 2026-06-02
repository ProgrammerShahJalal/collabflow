import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { presentTask } from '../common/serializers/presenters';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(@Query() query: TaskQueryDto, @CurrentUser() user: User) {
    const result = await this.tasksService.findAll(query, user);
    return { data: result.data.map(presentTask), meta: result.meta };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
    return presentTask(await this.tasksService.create(dto, user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return presentTask(await this.tasksService.findOne(id, user));
  }

  // Assignee allowed in addition to elevated roles — ownership enforced in service.
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return presentTask(await this.tasksService.update(id, dto, user));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
  ) {
    return presentTask(
      await this.tasksService.updateStatus(id, dto.status, user),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.tasksService.remove(id, user);
    return { success: true };
  }
}
