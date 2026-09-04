import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentsDto {
  @ApiProperty({ example: '66f0a1b2c3d4e5f678901234' })
  @IsMongoId()
  learnerId: string;

  @ApiProperty({
    type: [String],
    example: ['66f0a1b2c3d4e5f678901111', '66f0a1b2c3d4e5f678901222'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  videoIds: string[];
}
