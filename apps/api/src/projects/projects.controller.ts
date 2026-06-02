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
import { ProjectsService } from './projects.service';
import {
  AddMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { presentProject } from '../common/serializers/presenters';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query() query: ProjectQueryDto, @CurrentUser() user: User) {
    const result = await this.projectsService.findAll(query, user);
    return { data: result.data.map(presentProject), meta: result.meta };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) {
    return presentProject(await this.projectsService.create(dto, user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return presentProject(await this.projectsService.findOne(id, user));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return presentProject(await this.projectsService.update(id, dto, user));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.projectsService.remove(id, user);
    return { success: true };
  }

  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: User,
  ) {
    return presentProject(await this.projectsService.addMember(id, dto, user));
  }

  @Delete(':id/members/:uid')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @UseGuards(RolesGuard)
  async removeMember(
    @Param('id') id: string,
    @Param('uid') uid: string,
    @CurrentUser() user: User,
  ) {
    return presentProject(
      await this.projectsService.removeMember(id, uid, user),
    );
  }
}
