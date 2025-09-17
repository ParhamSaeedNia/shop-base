import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger.service';

interface RequestObject {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

interface ErrorObject {
  message?: string;
  stack?: string;
}

@Injectable()
export class ServiceCallInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const startTime = Date.now();

    // Get request parameters
    const args = context.getArgs();
    const request = args.find(
      (arg: unknown): arg is RequestObject =>
        arg !== null && typeof arg === 'object' && 'body' in arg,
    );

    const params = request
      ? {
          body: request.body,
          query: request.query,
          params: request.params,
        }
      : args;

    return next.handle().pipe(
      tap({
        next: (result: unknown) => {
          const duration = Date.now() - startTime;
          this.logger.logServiceCall(
            className,
            methodName,
            params,
            result,
            duration,
          );
        },
        error: (error: ErrorObject) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Service call failed: ${className}.${methodName}`,
            error.stack,
            'ServiceCall',
          );
          this.logger.logServiceCall(
            className,
            methodName,
            params,
            { error: error.message },
            duration,
          );
        },
      }),
    );
  }
}
