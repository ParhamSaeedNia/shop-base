import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../entities/user.model';
import { RefreshToken } from '../entities/refresh-token.model';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/request/create-user.dto';
import { LoginDto } from './dto/request/login.dto';
import { AuthResponseDto } from './dto/response/auth.response';
import { RefreshTokenResponse } from './dto/response/refresh-token.response';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
  ) {}
  //---------------------------------------------
  /** Issue new access & refresh tokens for a given user */
  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };
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
    const existingUser = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    console.log('✅ User created successfully with ID:', newUser.id);

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
  /** Authenticate user by email & password */
  async authenticateUser(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
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
}
