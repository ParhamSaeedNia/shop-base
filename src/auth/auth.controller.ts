import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
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
import { AuthResponseDto } from './dto/response/auth.response';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenResponse } from './dto/response/refresh-token.response';
import type { Request, Response } from 'express';
import type { RequestUser } from './interfaces/request-user.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/request/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    type: AuthResponseDto,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or email already exists',
  })
  @Post('signup')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refreshToken'>> {
    const result = await this.authService.registerUser(dto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set access token as a cookie for JWT strategy
    res.cookie('accessToken', result.token, {
      httpOnly: false, // Allow client-side access for logout
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (same as JWT expiration)
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refreshToken, ...responseData } = result;
    return responseData;
  }

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
    type: AuthResponseDto,
    description: 'Successfully authenticated',
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
  ): Promise<Omit<AuthResponseDto, 'refreshToken'>> {
    const result = await this.authService.issueTokensForUser(req.user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set access token as a cookie for JWT strategy
    res.cookie('accessToken', result.token, {
      httpOnly: false, // Allow client-side access for logout
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (same as JWT expiration)
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refreshToken, ...responseData } = result;
    return responseData;
  }

  /** Refresh access token */
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Use refresh token from cookies to get new access and refresh tokens',
  })
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    type: RefreshTokenResponse,
    description: 'Tokens successfully refreshed',
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
  ): Promise<Omit<RefreshTokenResponse, 'refreshToken'>> {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.rotateRefreshToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set new access token as a cookie for JWT strategy
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: false, // Allow client-side access for logout
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (same as JWT expiration)
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refreshToken: _refreshToken, ...responseData } = tokens;
    return responseData;
  }

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
    console.log('🚪 Logout requested for user:', req.user);
    console.log('🍪 Request cookies:', req.cookies);
    console.log('🔑 Authorization header:', req.headers.authorization);

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

    console.log('✅ Logout completed successfully');
    return { message: 'Successfully logged out' };
  }
}
