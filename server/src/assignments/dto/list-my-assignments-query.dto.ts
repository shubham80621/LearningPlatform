import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum MyAssignmentStatusFilter {
  ALL = 'all',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  /** In progress, or started but not completed. */
  CONTINUE = 'continue',
}

export class ListMyAssignmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Matches video title or description' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: MyAssignmentStatusFilter,
    default: MyAssignmentStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(MyAssignmentStatusFilter)
  status?: MyAssignmentStatusFilter;
}
