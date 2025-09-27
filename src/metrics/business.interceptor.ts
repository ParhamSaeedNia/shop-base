import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class BusinessInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    // Track business operations
    if (this.isAuthOperation(className, methodName)) {
      return this.trackAuthOperation(context, next);
    }

    if (this.isProductOperation(className, methodName)) {
      return this.trackProductOperation(context, next);
    }

    return next.handle();
  }

  private isAuthOperation(className: string, methodName: string): boolean {
    return (
      className.toLowerCase().includes('auth') ||
      methodName.toLowerCase().includes('login') ||
      methodName.toLowerCase().includes('register') ||
      methodName.toLowerCase().includes('logout') ||
      methodName.toLowerCase().includes('refresh')
    );
  }

  private isProductOperation(className: string, methodName: string): boolean {
    return (
      className.toLowerCase().includes('product') ||
      methodName.toLowerCase().includes('product')
    );
  }

  private trackAuthOperation(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const methodName = context.getHandler().name;

    return next.handle().pipe(
      tap(() => {
        this.metricsService.recordAuthOperation(methodName, 'success');
      }),
      catchError((error) => {
        this.metricsService.recordAuthOperation(methodName, 'error');
        throw error;
      }),
    );
  }

  private trackProductOperation(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const methodName = context.getHandler().name;

    return next.handle().pipe(
      tap(() => {
        this.metricsService.recordProductOperation(methodName, 'success');
      }),
      catchError((error) => {
        this.metricsService.recordProductOperation(methodName, 'error');
        throw error;
      }),
    );
  }
}
