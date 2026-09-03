import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({ example: 'Intro to Arrays' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'Learn array basics with timestamp quizzes.' })
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty({ example: 180, description: 'Duration in seconds, read from the video file' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration: number;
}
