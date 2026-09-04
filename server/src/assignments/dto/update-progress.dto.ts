import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ example: 42, description: 'Current playback position in seconds' })
  @IsNumber()
  @Min(0)
  lastWatchedTimestamp: number;
}
