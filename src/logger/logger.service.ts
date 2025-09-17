import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(
          ({ timestamp, level, message, context, ...meta }) => {
            return JSON.stringify({
              timestamp,
              level,
              message,
              context,
              ...meta,
            });
          },
        ),
      ),
      defaultMeta: { service: 'shop-base' },
      transports: [
        // Daily rotate file transport
        new winston.transports.DailyRotateFile({
          filename: join(process.cwd(), 'logs', 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
        // Error log file
        new winston.transports.DailyRotateFile({
          filename: join(process.cwd(), 'logs', 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(
              ({ timestamp, level, message, context }: any) => {
                const contextStr =
                  typeof context === 'string' ? context : 'Application';
                return `${String(timestamp)} [${contextStr}] ${String(level)}: ${String(message)}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom method for service call logging
  logServiceCall(
    serviceName: string,
    methodName: string,
    params?: any,
    result?: any,
    duration?: number,
  ) {
    const logData = {
      serviceName,
      methodName,
      params: params ? JSON.stringify(params) : undefined,
      result: result ? JSON.stringify(result) : undefined,
      duration: duration ? `${duration}ms` : undefined,
    };

    this.logger.info('Service call executed', {
      context: 'ServiceCall',
      ...logData,
    });
  }

  // Custom method for HTTP request logging
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration?: number,
    userAgent?: string,
    ip?: string,
  ) {
    const logData = {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      userAgent,
      ip,
    };

    this.logger.info('HTTP request processed', {
      context: 'HttpRequest',
      ...logData,
    });
  }
}
