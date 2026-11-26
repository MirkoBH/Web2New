import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  TokenPayload,
  AuthenticatedUser,
} from '../common/types/authenticated-user';
import type { EnvironmentVariables } from '../config/validate-environment';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET_PASSWORD', { infer: true }),
      algorithms: ['HS256'],
    });
  }

  validate(content: TokenPayload): AuthenticatedUser {
    return { id: content.sub, email: content.email };
  }
}
