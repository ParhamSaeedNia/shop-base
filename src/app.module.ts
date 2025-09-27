import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { PrometheusInterceptor } from './metrics/prometheus.interceptor';
import { DatabaseInterceptor } from './metrics/database.interceptor';
import { BusinessInterceptor } from './metrics/business.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    MetricsModule,
    HealthModule,
    DatabaseModule,
    AuthModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BusinessInterceptor,
    },
  ],
})
export class AppModule {}
