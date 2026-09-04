import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ example: '66f0a1b2c3d4e5f678901234' })
  @IsMongoId()
  questionId: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Selected option indexes for single/multiple choice',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  selectedOptionIndexes?: number[];

  @ApiPropertyOptional({ description: 'Answer text for short questions' })
  @IsOptional()
  @IsString()
  shortAnswer?: string;
}
