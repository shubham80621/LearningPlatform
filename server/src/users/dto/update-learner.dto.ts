import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLearnerDto {
  @ApiPropertyOptional({ example: 'Alex Learner' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'alex@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'learner123',
    minLength: 8,
    description: 'Leave empty to keep the current password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
