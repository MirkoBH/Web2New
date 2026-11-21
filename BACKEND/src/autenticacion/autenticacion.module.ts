import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { VariablesEntorno } from '../configuracion/validar-entorno';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService<VariablesEntorno, true>) => ({
        secret: configuracion.get('JWT_SECRET_PASSWORD', { infer: true }),
        signOptions: { expiresIn: '7d', algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, JwtStrategy],
})
export class AutenticacionModule {}
