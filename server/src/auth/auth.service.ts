import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { parseDurationMs } from './auth-duration';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

type AuthUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.LEARNER,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Rotate refresh token: validate → delete old → issue new access + refresh.
   * Rotation prevents reuse if a token is stolen after a successful refresh.
   */
  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenModel.findOne({ tokenHash }).exec();

    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      if (stored) {
        await this.refreshTokenModel.deleteOne({ _id: stored._id }).exec();
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(stored.userId.toString());
    if (!user) {
      await this.refreshTokenModel.deleteOne({ _id: stored._id }).exec();
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete before issuing so concurrent refresh of the same token fails.
    await this.refreshTokenModel.deleteOne({ _id: stored._id }).exec();

    return this.buildAuthResponse(user);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenModel.deleteOne({ tokenHash }).exec();
    return { ok: true };
  }

  private async buildAuthResponse(user: AuthUser) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessExpiresIn(),
    });
    const refreshToken = await this.issueRefreshToken(user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async issueRefreshToken(userId: string) {
    const raw = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs());

    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });

    return raw;
  }

  private hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  private accessExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
      this.configService.get<string>('JWT_EXPIRATION') ||
      '15m'
    );
  }

  private refreshTtlMs(): number {
    const raw =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    return parseDurationMs(raw);
  }
}
