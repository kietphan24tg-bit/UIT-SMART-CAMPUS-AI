import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_PREFIX, APP_NAME, APP_VERSION } from '@smart-campus/shared';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.originalUrl.includes('/canteen/products/image')) {
      next();
      return;
    }

    const startedAt = Date.now();
    console.warn(`[upload] ${req.method} ${req.originalUrl} started`);

    res.on('finish', () => {
      console.warn(
        `[upload] ${req.method} ${req.originalUrl} completed ${res.statusCode} in ${Date.now() - startedAt}ms`,
      );
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        console.warn(
          `[upload] ${req.method} ${req.originalUrl} closed before response in ${Date.now() - startedAt}ms`,
        );
      }
    });

    next();
  });

  app.setGlobalPrefix(API_PREFIX, {
    exclude: [{ path: 'live/(.*)', method: RequestMethod.ALL }],
  });
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle(APP_NAME)
    .setDescription('Smart Campus API Documentation')
    .setVersion(APP_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.warn(`${APP_NAME} API running on http://localhost:${port}`);
  console.warn(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
