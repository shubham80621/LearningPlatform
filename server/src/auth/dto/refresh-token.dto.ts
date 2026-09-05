import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Opaque refresh token. Optional when the HttpOnly refresh cookie is present.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
