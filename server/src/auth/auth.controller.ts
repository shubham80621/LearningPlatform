import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './auth-cookies';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { throttlerLimits } from '../common/throttler.config';

const { ttl, authLimit } = throttlerLimits();

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: authLimit, ttl } })
  @ApiOperation({
    summary: 'Register a new user (learners; prefer admin-created learners)',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: authLimit, ttl } })
  @ApiOperation({
    summary:
      'Login — sets HttpOnly access + refresh cookies (tokens also in body for Swagger)',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: authLimit, ttl } })
  @ApiOperation({
    summary:
      'Rotate tokens using the refresh cookie (or body.refreshToken for API clients)',
  })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto = {},
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      dto.refreshToken ||
      (req.cookies?.[REFRESH_COOKIE] as string | undefined);

    if (!raw) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      const result = await this.authService.refresh(raw);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      return result;
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  @Post('logout')
  @Throttle({ default: { limit: authLimit, ttl } })
  @ApiOperation({ summary: 'Revoke refresh token and clear auth cookies' })
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto = {},
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      dto.refreshToken ||
      (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (raw) {
      await this.authService.logout(raw);
    }
    clearAuthCookies(res);
    return { ok: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get the current authenticated user (cookie or Bearer)',
  })
  me(
    @Req()
    req: Request & {
      user: { userId: string; email: string; role: string; name: string };
    },
  ) {
    return {
      id: req.user.userId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
