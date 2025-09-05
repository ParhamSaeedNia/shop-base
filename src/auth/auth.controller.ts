import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { Request, Response } from 'express';
import type { RequestUser } from './interfaces/request-user.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/request/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  //---------------------------------------------
  /** Register a new user */
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email, password, and full name',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: { type: 'string', example: 'john.doe@example.com' },
            fullName: { type: 'string', example: 'John Doe' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or email already exists',
  })
  @Post('signup')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string; fullName: string } }> {
    const result = await this.authService.registerUser(dto);

    // Set both tokens as httpOnly cookies for maximum security
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', result.token, {
      httpOnly: true, // Secure: not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Return only user data, no tokens
    return { user: result.user };
  }
  //---------------------------------------------
  /** Login with credentials */
  @ApiOperation({
    summary: 'Login with credentials',
    description:
      'Authenticate user with email and password to receive access and refresh tokens',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: { type: 'string', example: 'john.doe@example.com' },
            fullName: { type: 'string', example: 'John Doe' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: Request & { user: RequestUser },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string; fullName: string } }> {
    const result = await this.authService.issueTokensForUser(req.user);

    // Set both tokens as httpOnly cookies for maximum security
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', result.token, {
      httpOnly: true, // Secure: not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Return only user data, no tokens
    return { user: result.user };
  }
  //---------------------------------------------
  /** Refresh access token */
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Use refresh token from cookies to get new access and refresh tokens',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tokens refreshed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired refresh token',
  })
  @ApiCookieAuth()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.rotateRefreshToken(refreshToken);

    // Set both tokens as httpOnly cookies for maximum security
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, // Secure: not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Return only success message, no tokens
    return { message: 'Tokens refreshed successfully' };
  }
  //---------------------------------------------
  /** Logout user */
  @ApiOperation({
    summary: 'Logout and revoke tokens',
    description:
      'Logout user and revoke all refresh tokens (requires valid access token)',
  })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired access token',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request & { user: RequestUser },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.revokeUserTokens(req.user.sub);

    // Clear both access token and refresh token cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('accessToken', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Successfully logged out' };
  }
  //---------------------------------------------
  /** Simple protected endpoint (no database access) */
  @ApiOperation({
    summary: 'Test protected endpoint',
    description:
      'Simple endpoint that requires authentication - returns user info from JWT token',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'You are authenticated!' },
        user: {
          type: 'object',
          properties: {
            sub: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: { type: 'string', example: 'john.doe@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired access token',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @HttpCode(200)
  getMe(@Req() req: Request & { user: RequestUser }): Promise<{
    message: string;
    user: RequestUser;
  }> {
    return Promise.resolve({
      message: 'You are authenticated!',
      user: req.user,
    });
  }
  //---------------------------------------------
  /** Get current user profile (protected endpoint) */
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'john.doe@example.com' },
        fullName: { type: 'string', example: 'John Doe' },
        message: { type: 'string', example: 'Profile retrieved successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired access token',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @HttpCode(200)
  async getProfile(@Req() req: Request & { user: RequestUser }): Promise<{
    id: string;
    email: string;
    fullName: string;
    message: string;
  }> {
    // Get user details from the database
    const user = await this.authService.getUserById(req.user.sub);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      message: 'Profile retrieved successfully',
    };
  }
}
