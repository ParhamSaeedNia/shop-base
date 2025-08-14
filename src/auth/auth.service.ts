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
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(RefreshToken)
    private refreshTokenModel: typeof RefreshToken,
  ) {}
  // ---------------------------------------------
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
    });

    await this.refreshTokenModel.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { accessToken, refreshToken };
  }
  // ---------------------------------------------
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const tokenDoc = await this.refreshTokenModel.findOne({
        where: {
          token: refreshToken,
          isRevoked: false,
        },
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
      const tokens = await this.generateTokens(user);

      await tokenDoc.update({ isRevoked: true });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  // ---------------------------------------------
  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.update(
      { isRevoked: true },
      { where: { userId } },
    );
  }
  // ---------------------------------------------
  async signup(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(newUser);
    return {
      token: tokens.accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
      refreshToken: tokens.refreshToken,
    };
  }
  // ---------------------------------------------
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userModel.findOne({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user);

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      };
    } catch (error) {
      console.error('Password comparison error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
  // ---------------------------------------------
  async validateUser(email: string, password: string): Promise<null | User> {
    const user = await this.userModel.findOne({
      where: { email },
      raw: false,
    });

    if (!user) {
      return null;
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
      return user;
    } catch (error) {
      console.error('Password comparison error:', error);
      return null;
    }
  }
}
