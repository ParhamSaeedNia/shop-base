import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PrometheusInterceptor } from './prometheus.interceptor';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, PrometheusInterceptor],
  exports: [MetricsService, PrometheusInterceptor],
})
export class MetricsModule {}
