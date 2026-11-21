import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  ContenidoToken,
  UsuarioAutenticado,
} from '../comun/tipos/usuario-autenticado';
import type { VariablesEntorno } from '../configuracion/validar-entorno';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configuracion: ConfigService<VariablesEntorno, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuracion.get('JWT_SECRET_PASSWORD', { infer: true }),
      algorithms: ['HS256'],
    });
  }

  validate(contenido: ContenidoToken): UsuarioAutenticado {
    return { id: contenido.sub, email: contenido.email };
  }
}
