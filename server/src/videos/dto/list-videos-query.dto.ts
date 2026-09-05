import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum VideoStatusFilter {
  ALL = 'all',
  PUBLISHED = 'published',
  DRAFT = 'draft',
}

export class ListVideosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Matches title or description' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: VideoStatusFilter, default: VideoStatusFilter.ALL })
  @IsOptional()
  @IsEnum(VideoStatusFilter)
  status?: VideoStatusFilter;

  @ApiPropertyOptional({
    description:
      'Learner id. Excludes videos this learner already has, for the assign picker.',
  })
  @IsOptional()
  @IsMongoId()
  unassignedFor?: string;
}
