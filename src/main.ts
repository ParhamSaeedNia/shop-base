import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    console.warn(
      'Warning: COOKIE_SECRET environment variable is not set. Using default secret.',
    );
  }

  app.use(cookieParser(cookieSecret || 'default-cookie-secret'));

  // Add middleware to log all requests for debugging
  app.use((req: any, res: any, next: any) => {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log('🍪 Cookies:', req.cookies);
    console.log('🔑 Authorization:', req.headers.authorization);
    next();
  });

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
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
void bootstrap();
