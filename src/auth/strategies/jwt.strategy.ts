import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: (req: Request) => {
        let token: string | null = null;

        // First try to get token from cookies (accessToken)
        if (req.cookies && req.cookies.accessToken) {
          token = req.cookies.accessToken as string;
          console.log('🔑 Token found in cookies (accessToken)');
        }
        // Then try Authorization header (Bearer token)
        else if (req.headers.authorization?.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
          console.log('🔑 Token found in Authorization header');
        }

        if (!token) {
          console.log('❌ No JWT token found in request');
          console.log('📋 Request cookies:', req.cookies);
          console.log('📋 Request headers:', req.headers.authorization);
        } else {
          console.log('✅ JWT token extracted successfully');
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): RequestUser {
    console.log('🔍 JWT payload validated:', {
      sub: payload.sub,
      email: payload.email,
    });
    return { sub: payload.sub, email: payload.email };
  }
}
