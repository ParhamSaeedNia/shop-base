# Monitoring Setup with Prometheus and Grafana

This project includes comprehensive monitoring using Prometheus for metrics collection and Grafana for visualization.

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Start all services:**

   ```bash
   docker-compose up -d
   ```

2. **Access the services:**
   - **Application**: http://localhost:3000
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3001 (admin/admin)
   - **Metrics Endpoint**: http://localhost:3000/metrics

### Manual Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the application:**

   ```bash
   pnpm run start:dev
   ```

3. **Start Prometheus:**

   ```bash
   docker run -d -p 9090:9090 -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
   ```

4. **Start Grafana:**
   ```bash
   docker run -d -p 3001:3000 grafana/grafana
   ```

## 📊 Available Metrics

### HTTP Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `http_request_errors_total` - HTTP error count

### Business Metrics

- `product_operations_total` - Product CRUD operations
- `auth_operations_total` - Authentication operations
- `database_operations_total` - Database operations
- `active_connections` - Active connections gauge

### Custom Labels

- **HTTP**: method, route, status_code
- **Product**: operation (create/read/update/delete), status (success/error)
- **Auth**: operation (register/login/refresh), status (success/error)
- **Database**: operation, table, status

## 🎯 Grafana Dashboard

The included dashboard provides:

- **HTTP Request Rate** - Requests per second
- **Response Time** - 95th percentile latency
- **Error Rate** - HTTP error percentage
- **Product Operations** - Business metrics
- **Auth Operations** - Authentication metrics
- **Database Operations** - Database performance

## 🔧 Configuration

### Prometheus Configuration

Located at `monitoring/prometheus.yml`:

- Scrapes application metrics every 5 seconds
- Retains data for 200 hours
- Monitors both Prometheus itself and the application

### Grafana Configuration

- **Datasource**: Auto-configured Prometheus connection
- **Dashboard**: Pre-loaded Shop Base monitoring dashboard
- **Credentials**: admin/admin (change in production)

## 📈 Adding Custom Metrics

### In Services

```typescript
import { MetricsService } from '../metrics/metrics.service';

constructor(private readonly metricsService: MetricsService) {}

// Record business metrics
this.metricsService.recordProductOperation('create', 'success');
this.metricsService.recordAuthOperation('login', 'error');
this.metricsService.recordDatabaseOperation('select', 'users', 'success');
```

### Custom Metrics

```typescript
// In MetricsService
private readonly customCounter = new Counter({
  name: 'custom_metric_total',
  help: 'Custom business metric',
  labelNames: ['label1', 'label2'],
});

// Usage
this.customCounter.inc({ label1: 'value1', label2: 'value2' });
```

## 🐳 Docker Services

| Service    | Port | Description         |
| ---------- | ---- | ------------------- |
| app        | 3000 | NestJS Application  |
| postgres   | 5433 | PostgreSQL Database |
| prometheus | 9090 | Prometheus Server   |
| grafana    | 3001 | Grafana Dashboard   |

## 🔍 Troubleshooting

### Metrics Not Appearing

1. Check if `/metrics` endpoint returns data
2. Verify Prometheus targets are UP
3. Check application logs for errors

### Grafana Connection Issues

1. Verify Prometheus datasource configuration
2. Check network connectivity between containers
3. Restart Grafana container if needed

### High Memory Usage

1. Adjust Prometheus retention settings
2. Reduce scrape frequency if needed
3. Monitor container resource limits

## 📚 Useful Queries

### Prometheus Queries

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Product operation success rate
rate(product_operations_total{status="success"}[5m]) / rate(product_operations_total[5m]) * 100
```

## 🚨 Alerts (Future Enhancement)

Consider adding alerting rules for:

- High error rates (>5%)
- Slow response times (>1s)
- Database connection failures
- Authentication failures
- Memory/CPU usage thresholds
