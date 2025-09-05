/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.model';
import { RefreshToken } from '../entities/refresh-token.model';
import { CreateUserDto } from './dto/request/create-user.dto';
import { LoginDto } from './dto/request/login.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let userModel: jest.Mocked<typeof User>;
  let refreshTokenModel: jest.Mocked<typeof RefreshToken>;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fullName: 'Test User',
    save: jest.fn(),
    update: jest.fn(),
  } as any;

  const mockRefreshToken = {
    id: 'token-id-123',
    token: 'refresh-token-123',
    userId: 'user-id-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    update: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getModelToken(User),
          useValue: {
            findOne: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    userModel = module.get(getModelToken(User));
    refreshTokenModel = module.get(getModelToken(RefreshToken));

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      const config = {
        JWT_EXPIRATION: '15m',
        REFRESH_TOKEN_EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000,
        REFRESH_TOKEN_EXPIRATION: '7d',
        JWT_SECRET: 'test-secret',
        REFRESH_TOKEN_SECRET: 'test-refresh-secret',
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      userModel.create.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-123');
      refreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await service.registerUser(createUserDto);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(userModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword123',
      });
      expect(result).toEqual({
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
        },
      });
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.registerUser(createUserDto)).rejects.toThrow(
        new UnauthorizedException('Email already exists'),
      );
    });
  });

  describe('authenticateUser', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should authenticate user successfully', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-123');
      refreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await service.authenticateUser(loginDto);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toEqual({
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.authenticateUser(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.authenticateUser(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('validateCredentials', () => {
    it('should return user if credentials are valid', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateCredentials(
        'test@example.com',
        'password123',
      );

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateCredentials(
        'test@example.com',
        'password123',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validateCredentials(
        'test@example.com',
        'wrongpassword',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('issueTokensForUser', () => {
    const userPayload = {
      sub: 'user-id-123',
      email: 'test@example.com',
    };

    it('should issue tokens for authenticated user', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-123');
      refreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await service.issueTokensForUser(userPayload);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: userPayload.email },
      });
      expect(result).toEqual({
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.issueTokensForUser(userPayload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    const refreshToken = 'valid-refresh-token';

    it('should rotate refresh token successfully', async () => {
      // Arrange
      const payload = { sub: 'user-id-123', email: 'test@example.com' };
      jwtService.verify.mockReturnValue(payload);
      refreshTokenModel.findOne.mockResolvedValue(mockRefreshToken);
      userModel.findByPk.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('new-access-token-123')
        .mockReturnValueOnce('new-refresh-token-123');
      refreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      // Act
      const result = await service.rotateRefreshToken(refreshToken);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(refreshTokenModel.findOne).toHaveBeenCalledWith({
        where: { token: refreshToken, isRevoked: false },
      });
      expect(userModel.findByPk).toHaveBeenCalledWith(payload.sub);
      expect(mockRefreshToken.update).toHaveBeenCalledWith({ isRevoked: true });
      expect(result).toEqual({
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
      });
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      // Arrange
      const payload = { sub: 'user-id-123', email: 'test@example.com' };
      jwtService.verify.mockReturnValue(payload);
      refreshTokenModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rotateRefreshToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      // Arrange
      const payload = { sub: 'user-id-123', email: 'test@example.com' };
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      jwtService.verify.mockReturnValue(payload);
      refreshTokenModel.findOne.mockResolvedValue(expiredToken);

      // Act & Assert
      await expect(service.rotateRefreshToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
      expect(expiredToken.update).toHaveBeenCalledWith({ isRevoked: true });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const payload = { sub: 'user-id-123', email: 'test@example.com' };
      jwtService.verify.mockReturnValue(payload);
      refreshTokenModel.findOne.mockResolvedValue(mockRefreshToken);
      userModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rotateRefreshToken(refreshToken)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('revokeUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Arrange
      const userId = 'user-id-123';
      refreshTokenModel.update.mockResolvedValue([1] as any);

      // Act
      await service.revokeUserTokens(userId);

      // Assert
      expect(refreshTokenModel.update).toHaveBeenCalledWith(
        { isRevoked: true },
        { where: { userId } },
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = 'user-id-123';
      userModel.findByPk.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(userModel.findByPk).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const userId = 'user-id-123';
      userModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserById(userId)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });
});
