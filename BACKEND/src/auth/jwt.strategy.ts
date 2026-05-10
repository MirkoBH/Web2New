import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secretOrKey = config.get<string>('JWT_SECRET_PASSWORD') ?? 'fallback_dev_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const usuario = await this.usersService.buscarPorId(payload.sub);
    if (!usuario) throw new UnauthorizedException('Token inválido');
    return payload;
  }
}
