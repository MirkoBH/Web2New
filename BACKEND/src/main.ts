import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────
  const corsOrigen = process.env.CORS_URL || 'http://localhost:8080';

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      const permitidos = [
        corsOrigen,
        'http://localhost:8080',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3001',
      ];

      // Permitir cualquier subdominio de railway.app
      const esRailway = origin.endsWith('.railway.app');
      const esPermitido = permitidos.includes(origin) || esRailway;

      if (esPermitido) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido — ${origin}`));
      }
    },
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

  app.setGlobalPrefix('api');

  const puerto = process.env.PORT || 3000;
  await app.listen(puerto, '0.0.0.0');
  console.log(`🚀 AutoPulse API corriendo en: http://0.0.0.0:${puerto}/api`);
}

bootstrap();
