import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import { ServiceCallInterceptor } from './logger/interceptors/service-call.interceptor';
import { HttpRequestInterceptor } from './logger/interceptors/http-request.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Get logger service
  const logger = app.get(LoggerService);
  const serviceCallInterceptor = app.get(ServiceCallInterceptor);
  const httpRequestInterceptor = app.get(HttpRequestInterceptor);

  // Set global interceptors
  app.useGlobalInterceptors(httpRequestInterceptor, serviceCallInterceptor);

  app.useGlobalPipes(new ValidationPipe());

  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    console.warn(
      'Warning: COOKIE_SECRET environment variable is not set. Using default secret.',
    );
  }

  app.use(cookieParser(cookieSecret || 'default-cookie-secret'));

  const config = new DocumentBuilder()
    .setTitle('Shop API')
    .setDescription('The Shop API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { withCredentials: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
    'Bootstrap',
  );
}
void bootstrap();
