import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarsModule } from './cars/cars.module';
import { IaModule } from './ia/ia.module';
import { ConsultasModule } from './consultas/consultas.module';

@Module({
  imports: [
    // ── Variables de entorno ───────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Base de datos (TypeORM + Supabase PostgreSQL) ──────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl:
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),

    // ── Servir imágenes subidas como archivos estáticos ────────
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // ── Módulos del dominio ────────────────────────────────────
    AuthModule,
    UsersModule,
    CarsModule,
    IaModule,
    ConsultasModule,
  ],
})
export class AppModule {}
