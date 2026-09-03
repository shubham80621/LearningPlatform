import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateLearnerDto {
  @ApiProperty({ example: 'Alex Learner' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'learner123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
