import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logger.service';

interface HttpError {
  status?: number;
  stack?: string;
}

@Injectable()
export class HttpRequestInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url, headers } = request;
    const userAgent = headers['user-agent'];
    const ip = request.ip || request.connection.remoteAddress;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.logHttpRequest(
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip,
          );
        },
        error: (error: HttpError) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `HTTP request failed: ${method} ${url}`,
            error.stack,
            'HttpRequest',
          );

          this.logger.logHttpRequest(
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip,
          );
        },
      }),
    );
  }
}
