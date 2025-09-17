# Logger Module

A comprehensive logging solution for the Shop Base application using Winston with daily file rotation.

## Features

- **Daily Log Rotation**: Creates new log files each day
- **Multiple Log Levels**: Info, Error, Warn, Debug, Verbose
- **Service Call Logging**: Automatically logs all service method calls
- **HTTP Request Logging**: Logs all HTTP requests with timing and status
- **Structured Logging**: JSON format for easy parsing and analysis
- **File Compression**: Old log files are automatically compressed
- **Console Output**: Development-friendly console logging with colors

## Log Files

The logger creates the following log files in the `logs/` directory:

- `application-YYYY-MM-DD.log` - General application logs
- `error-YYYY-MM-DD.log` - Error logs only
- `application-YYYY-MM-DD.log.gz` - Compressed old log files

## Usage

### Basic Logging

```typescript
import { LoggerService } from './logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  async doSomething() {
    this.logger.log('Operation started', 'MyService');
    this.logger.warn('Warning message', 'MyService');
    this.logger.error('Error occurred', error.stack, 'MyService');
  }
}
```

### Service Call Logging

Service calls are automatically logged by the `ServiceCallInterceptor`. No additional code needed.

### HTTP Request Logging

HTTP requests are automatically logged by the `HttpRequestInterceptor`. No additional code needed.

### Custom Logging Methods

```typescript
// Log service calls manually
this.logger.logServiceCall(
  'UserService',
  'createUser',
  { email: 'user@example.com' },
  { id: '123', email: 'user@example.com' },
  150, // duration in ms
);

// Log HTTP requests manually
this.logger.logHttpRequest(
  'POST',
  '/api/users',
  201,
  150, // duration in ms
  'Mozilla/5.0...',
  '192.168.1.1',
);
```

## Configuration

The logger is configured in `src/logger/logger.service.ts`:

- **Log Level**: `info` (configurable)
- **Max File Size**: 20MB
- **Max Files**: 14 days for general logs, 30 days for error logs
- **Compression**: Enabled for old files
- **Console Output**: Enabled for development

## Log Format

### Console Output

```
2024-01-15 10:30:45 [AuthService] info: User registered successfully: 123
```

### File Output (JSON)

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User registered successfully: 123",
  "context": "AuthService",
  "service": "shop-base"
}
```

### Service Call Log

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Service call executed",
  "context": "ServiceCall",
  "serviceName": "AuthService",
  "methodName": "registerUser",
  "params": "{\"email\":\"user@example.com\"}",
  "result": "{\"id\":\"123\"}",
  "duration": "150ms",
  "service": "shop-base"
}
```

### HTTP Request Log

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "HTTP request processed",
  "context": "HttpRequest",
  "method": "POST",
  "url": "/api/auth/register",
  "statusCode": 201,
  "duration": "150ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1",
  "service": "shop-base"
}
```

## Integration

The logger is automatically integrated into the application:

1. **Global Module**: Available throughout the application
2. **Global Interceptors**: Automatically logs service calls and HTTP requests
3. **Bootstrap Logging**: Application startup messages are logged

## Environment Variables

No additional environment variables are required. The logger uses sensible defaults.

## File Management

- Log files are automatically rotated daily
- Old files are compressed to save space
- Files older than the retention period are automatically deleted
- The `logs/` directory is included in `.gitignore`

## Performance

- Logging is asynchronous and non-blocking
- File operations are optimized for performance
- Console output is only enabled in development
- Structured logging allows for efficient log analysis
