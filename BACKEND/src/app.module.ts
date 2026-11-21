import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { AutosModule } from './autos/autos.module';
import { EstrategiaNombresSnake } from './comun/base-de-datos/estrategia-nombres-snake';
import {
  validarEntorno,
  VariablesEntorno,
} from './configuracion/validar-entorno';
import { ConsultasModule } from './consultas/consultas.module';
import { SaludModule } from './salud/salud.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService<VariablesEntorno, true>) => ({
        type: 'postgres',
        url: configuracion.get('DATABASE_URL', { infer: true }),
        ssl: configuracion.get('DB_SSL', { infer: true })
          ? { rejectUnauthorized: false }
          : false,
        autoLoadEntities: true,
        // El esquema se maneja con los scripts de BACKEND/base-de-datos,
        // nunca automáticamente: sincronizar en producción puede borrar datos.
        synchronize: false,
        namingStrategy: new EstrategiaNombresSnake(),
      }),
    }),

    // Límite general: 100 pedidos por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    AutenticacionModule,
    UsuariosModule,
    AutosModule,
    ConsultasModule,
    SaludModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
