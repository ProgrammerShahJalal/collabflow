import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../task.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export enum BulkTaskAction {
  UPDATE_STATUS = 'update_status',
  DELETE = 'delete',
}

export class CreateTaskDto {
  @ApiProperty({ minLength: 2, maxLength: 160 })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ description: 'Project ID the task belongs to' })
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Attachment URLs' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 160 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Assignee user ID (null to unassign)' })
  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Attachment URLs' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class BulkTaskActionDto {
  @ApiProperty({ type: [String], description: 'Task IDs to act on (max 100)' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  taskIds!: string[];

  @ApiProperty({ enum: BulkTaskAction })
  @IsEnum(BulkTaskAction)
  action!: BulkTaskAction;

  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Required when action is update_status',
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: ['upcoming', 'overdue'] })
  @IsOptional()
  @IsString()
  deadlineStatus?: 'upcoming' | 'overdue';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
