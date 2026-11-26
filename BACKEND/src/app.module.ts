import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CarsModule } from './cars/cars.module';
import {
  validateEnvironment,
  EnvironmentVariables,
} from './config/validate-environment';
import { InquiriesModule } from './inquiries/inquiries.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', { infer: true }),
        ssl: config.get('DB_SSL', { infer: true })
          ? { rejectUnauthorized: false }
          : false,
        autoLoadEntities: true,
        // El esquema se maneja con los scripts de BACKEND/database,
        // nunca automáticamente: sincronizar en producción puede borrar datos.
        synchronize: false,
      }),
    }),

    // Límite general: 100 pedidos por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    AuthModule,
    UsersModule,
    CarsModule,
    InquiriesModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
