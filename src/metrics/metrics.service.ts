import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly httpRequestErrors: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly productOperations: Counter<string>;
  private readonly authOperations: Counter<string>;
  private readonly databaseOperations: Counter<string>;

  constructor() {
    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // HTTP Request Total Counter
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // HTTP Request Errors Counter
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
    });

    // Active Connections Gauge
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Product Operations Counter
    this.productOperations = new Counter({
      name: 'product_operations_total',
      help: 'Total number of product operations',
      labelNames: ['operation', 'status'],
    });

    // Auth Operations Counter
    this.authOperations = new Counter({
      name: 'auth_operations_total',
      help: 'Total number of authentication operations',
      labelNames: ['operation', 'status'],
    });

    // Database Operations Counter
    this.databaseOperations = new Counter({
      name: 'database_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'table', 'status'],
    });

    // Register all metrics
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.httpRequestErrors);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.productOperations);
    register.registerMetric(this.authOperations);
    register.registerMetric(this.databaseOperations);
  }

  //---------------------------------------------
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
    };

    this.httpRequestDuration.observe(labels, duration / 1000);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        ...labels,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  //---------------------------------------------
  recordProductOperation(operation: string, status: 'success' | 'error'): void {
    this.productOperations.inc({ operation, status });
  }

  //---------------------------------------------
  recordAuthOperation(operation: string, status: 'success' | 'error'): void {
    this.authOperations.inc({ operation, status });
  }

  //---------------------------------------------
  recordDatabaseOperation(
    operation: string,
    table: string,
    status: 'success' | 'error',
  ): void {
    this.databaseOperations.inc({ operation, table, status });
  }

  //---------------------------------------------
  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  //---------------------------------------------
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  //---------------------------------------------
  getContentType(): string {
    return register.contentType;
  }
}
