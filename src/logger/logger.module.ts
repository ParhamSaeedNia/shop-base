import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ServiceCallInterceptor } from './interceptors/service-call.interceptor';
import { HttpRequestInterceptor } from './interceptors/http-request.interceptor';

@Global()
@Module({
  providers: [LoggerService, ServiceCallInterceptor, HttpRequestInterceptor],
  exports: [LoggerService, ServiceCallInterceptor, HttpRequestInterceptor],
})
export class LoggerModule {}
