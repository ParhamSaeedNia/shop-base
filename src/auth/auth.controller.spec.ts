/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { RequestUser } from './interfaces/request-user.interface';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as jest.Mocked<Response>;

  const mockRequest = {
    cookies: {},
    user: {
      sub: 'user-id-123',
      email: 'test@example.com',
    } as RequestUser,
  } as jest.Mocked<Request & { user: RequestUser }>;

  const mockAuthResponse = {
    token: 'access-token-123',
    refreshToken: 'refresh-token-123',
    user: {
      id: 'user-id-123',
      email: 'test@example.com',
      fullName: 'Test User',
    },
  };

  const mockRefreshResponse = {
    accessToken: 'new-access-token-123',
    refreshToken: 'new-refresh-token-123',
  };

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    fullName: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerUser: jest.fn(),
            issueTokensForUser: jest.fn(),
            rotateRefreshToken: jest.fn(),
            revokeUserTokens: jest.fn(),
            getUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      authService.registerUser.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.register(createUserDto, mockResponse);

      // Assert
      expect(authService.registerUser).toHaveBeenCalledWith(createUserDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResponse.refreshToken,
        {
          httpOnly: true,
          secure: false, // NODE_ENV is not production in test
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockAuthResponse.token,
        {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        },
      );
      expect(result).toEqual({
        token: mockAuthResponse.token,
        user: mockAuthResponse.user,
      });
    });

    it('should handle production environment cookie settings', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      authService.registerUser.mockResolvedValue(mockAuthResponse);

      // Act
      await controller.register(createUserDto, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResponse.refreshToken,
        expect.objectContaining({
          secure: true,
        }),
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      authService.issueTokensForUser.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(mockRequest, mockResponse);

      // Assert
      expect(authService.issueTokensForUser).toHaveBeenCalledWith(
        mockRequest.user,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockAuthResponse.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockAuthResponse.token,
        {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        },
      );
      expect(result).toEqual({
        token: mockAuthResponse.token,
        user: mockAuthResponse.user,
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      const requestWithCookie = {
        ...mockRequest,
        cookies: { refreshToken: 'valid-refresh-token' },
      } as jest.Mocked<Request & { user: RequestUser }>;
      authService.rotateRefreshToken.mockResolvedValue(mockRefreshResponse);

      // Act
      const result = await controller.refresh(requestWithCookie, mockResponse);

      // Assert
      expect(authService.rotateRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockRefreshResponse.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockRefreshResponse.accessToken,
        {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        },
      );
      expect(result).toEqual({
        accessToken: mockRefreshResponse.accessToken,
      });
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      // Arrange
      const requestWithoutCookie = {
        ...mockRequest,
        cookies: {},
      } as jest.Mocked<Request & { user: RequestUser }>;

      // Act & Assert
      await expect(
        controller.refresh(requestWithoutCookie, mockResponse),
      ).rejects.toThrow(new UnauthorizedException('Refresh token not found'));
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      // Arrange
      const requestWithCookie = {
        ...mockRequest,
        cookies: { refreshToken: 'invalid-refresh-token' },
      } as jest.Mocked<Request & { user: RequestUser }>;
      authService.rotateRefreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      // Act & Assert
      await expect(
        controller.refresh(requestWithCookie, mockResponse),
      ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      authService.revokeUserTokens.mockResolvedValue();

      // Act
      const result = await controller.logout(mockRequest, mockResponse);

      // Assert
      expect(authService.revokeUserTokens).toHaveBeenCalledWith(
        mockRequest.user.sub,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: false,
        secure: false,
        sameSite: 'strict',
      });
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should handle production environment cookie settings', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      authService.revokeUserTokens.mockResolvedValue();

      // Act
      await controller.logout(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          secure: true,
        }),
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getMe', () => {
    it('should return user info from JWT token', async () => {
      // Act
      const result = await controller.getMe(mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'You are authenticated!',
        user: mockRequest.user,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile from database', async () => {
      // Arrange
      authService.getUserById.mockResolvedValue(mockUser as unknown as any);

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(authService.getUserById).toHaveBeenCalledWith(
        mockRequest.user.sub,
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        message: 'Profile retrieved successfully',
      });
    });

    it('should handle user not found error', async () => {
      // Arrange
      authService.getUserById.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      // Act & Assert
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });
});
