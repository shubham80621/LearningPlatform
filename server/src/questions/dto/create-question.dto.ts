import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { QuestionType } from '../schemas/question.schema';

export class CreateQuestionDto {
  @ApiProperty({ example: 45, description: 'Timestamp in seconds' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timestamp: number;

  @ApiProperty({ enum: QuestionType, example: QuestionType.SINGLE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'What does let declare?' })
  @IsString()
  @MinLength(2)
  questionText: string;

  @ApiPropertyOptional({ example: ['A variable', 'A function', 'A class'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: [0] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  correctOptionIndexes?: number[];

  @ApiPropertyOptional({ example: 'variable' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;
}
