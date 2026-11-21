import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { VariablesEntorno } from './configuracion/validar-entorno';

async function iniciar(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configuracion =
    app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  // Render (y cualquier proxy) manda la IP real en X-Forwarded-For;
  // sin esto el límite de pedidos contaría a todos como la misma IP.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: configuracion.get('CORS_URL', { infer: true }),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const puerto = configuracion.get('PORT', { infer: true });
  await app.listen(puerto, '0.0.0.0');
  new Logger('Inicio').log(`API escuchando en el puerto ${puerto}`);
}

void iniciar();
