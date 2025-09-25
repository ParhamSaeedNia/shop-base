import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../entities/user.model';
import { RefreshToken } from '../entities/refresh-token.model';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/request/create-user.dto';
import { AuthResponseDto } from './dto/response/auth.response';
import { RefreshTokenResponse } from './dto/response/refresh-token.response';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
  ) {}
  //---------------------------------------------
  /** Issue new access & refresh tokens for a given user */
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
    });

    const refreshTokenTtl =
      this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS') ??
      7 * 24 * 60 * 60 * 1000;

    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!refreshTokenSecret) {
      throw new Error(
        'JWT_SECRET or REFRESH_TOKEN_SECRET environment variable is not defined',
      );
    }

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn:
        this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d',
    });

    await this.refreshTokenModel.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTokenTtl),
    });

    return { accessToken, refreshToken };
  }
  //---------------------------------------------
  /** Issue tokens for an already authenticated user */
  async issueTokensForUser(user: {
    sub: string;
    email: string;
  }): Promise<AuthResponseDto> {
    const userRecord = await this.userModel.findOne({
      where: { email: user.email },
    });
    if (!userRecord) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens(userRecord);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
      },
    };
  }
  //---------------------------------------------
  /** Rotate refresh token and issue new tokens */
  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!refreshTokenSecret) {
      throw new Error(
        'JWT_SECRET or REFRESH_TOKEN_SECRET environment variable is not defined',
      );
    }

    const payload: JwtPayload = this.jwtService.verify(refreshToken, {
      secret: refreshTokenSecret,
    });

    const tokenDoc = await this.refreshTokenModel.findOne({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenDoc.expiresAt) {
      await tokenDoc.update({ isRevoked: true });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userModel.findByPk(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens(user);

    // Revoke the old refresh token
    await tokenDoc.update({ isRevoked: true });

    return tokens;
  }
  //---------------------------------------------
  /** Revoke all refresh tokens for a user */
  async revokeUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.update(
      { isRevoked: true },
      { where: { userId } },
    );
  }

  /** Register a new user */
  async registerUser(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    this.logger.log(
      `Attempting to register user with email: ${createUserDto.email}`,
      'AuthService',
    );

    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      this.logger.warn(
        `Registration failed: Email already exists - ${createUserDto.email}`,
        'AuthService',
      );
      this.metricsService.recordAuthOperation('register', 'error');
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    this.logger.log(
      `User registered successfully: ${newUser.id}`,
      'AuthService',
    );

    this.metricsService.recordAuthOperation('register', 'success');

    const tokens = await this.issueTokens(newUser);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    };
  }
  //---------------------------------------------
  /** Validate user credentials (for guards/strategies) */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<null | User> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }
  //---------------------------------------------
  /** Get user by ID */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
