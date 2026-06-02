import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '../project.entity';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateProjectDto {
  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ type: [String], description: 'Member user IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  userId!: string;
}

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['upcoming', 'overdue'] })
  @IsOptional()
  @IsString()
  deadlineStatus?: 'upcoming' | 'overdue';
}
