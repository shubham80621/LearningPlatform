import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { RefreshToken } from './schemas/refresh-token.schema';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create' | 'findById'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let refreshTokenModel: {
    create: jest.Mock;
    findOne: jest.Mock;
    deleteOne: jest.Mock;
  };

  const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.LEARNER,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    refreshTokenModel = {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      deleteOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
              if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
              return undefined;
            },
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModel,
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jest.clearAllMocks();
    jwtService.sign.mockReturnValue('jwt-token');
    refreshTokenModel.create.mockResolvedValue({});
    refreshTokenModel.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });
  });

  describe('register', () => {
    it('creates a learner by default and returns tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(mockUser as never);

      const result = await authService.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.LEARNER,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: '507f1f77bcf86cd799439011',
          email: 'jane@example.com',
          role: UserRole.LEARNER,
        },
        { expiresIn: '15m' },
      );
      expect(refreshTokenModel.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.user).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: UserRole.LEARNER,
      });
    });

    it('respects an explicit role when provided', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(adminUser as never);

      await authService.register({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
    });

    it('throws ConflictException when email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as never);

      await expect(
        authService.register({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.user.id).toBe('507f1f77bcf86cd799439011');
    });

    it('throws UnauthorizedException when email is unknown', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'missing@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates tokens for a valid refresh token', async () => {
      const stored = {
        _id: 'rt-1',
        userId: { toString: () => '507f1f77bcf86cd799439011' },
        expiresAt: new Date(Date.now() + 60_000),
      };
      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(stored),
      });
      usersService.findById.mockResolvedValue(mockUser as never);

      const result = await authService.refresh('raw-refresh-token');

      expect(refreshTokenModel.deleteOne).toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe('raw-refresh-token');
    });

    it('rejects missing or expired refresh tokens', async () => {
      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(authService.refresh('gone')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
