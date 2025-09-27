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
export class DatabaseInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    // Only track database-related operations
    if (!this.isDatabaseOperation(className, methodName)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        this.metricsService.recordDatabaseOperation(
          methodName,
          this.getTableName(className),
          'success',
        );
      }),
      catchError((error) => {
        this.metricsService.recordDatabaseOperation(
          methodName,
          this.getTableName(className),
          'error',
        );
        throw error;
      }),
    );
  }

  private isDatabaseOperation(className: string, methodName: string): boolean {
    const dbKeywords = ['create', 'update', 'delete', 'find', 'save', 'remove'];
    return dbKeywords.some(
      (keyword) =>
        methodName.toLowerCase().includes(keyword) ||
        className.toLowerCase().includes('repository') ||
        className.toLowerCase().includes('service'),
    );
  }

  private getTableName(className: string): string {
    // Extract table name from class name (e.g., UserService -> users)
    const tableName = className
      .replace(/Service$/, '')
      .replace(/Repository$/, '')
      .replace(/Controller$/, '')
      .toLowerCase();

    return tableName.endsWith('s') ? tableName : `${tableName}s`;
  }
}
