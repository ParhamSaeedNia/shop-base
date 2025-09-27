import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PrometheusInterceptor } from './prometheus.interceptor';
import { DatabaseInterceptor } from './database.interceptor';
import { BusinessInterceptor } from './business.interceptor';

@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    PrometheusInterceptor,
    DatabaseInterceptor,
    BusinessInterceptor,
  ],
  exports: [
    MetricsService,
    PrometheusInterceptor,
    DatabaseInterceptor,
    BusinessInterceptor,
  ],
})
export class MetricsModule {}
