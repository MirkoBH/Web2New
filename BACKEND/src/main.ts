import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────
  const corsOrigen = process.env.CORS_URL || 'http://localhost:8080';
  app.enableCors({
    origin: [corsOrigen, 'http://localhost:8080', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Validación global ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Prefijo global de la API ───────────────────────────────────
  app.setGlobalPrefix('api');

  const puerto = process.env.PORT || 3000;
  await app.listen(puerto);
  console.log(`🚀 AutoPulse API corriendo en: http://localhost:${puerto}/api`);
}

bootstrap();
