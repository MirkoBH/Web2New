import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioAutenticado } from '../tipos/usuario-autenticado';

/** Inyecta en el handler el usuario autenticado por `JwtAuthGuard`. */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    const request = contexto
      .switchToHttp()
      .getRequest<Request & { user: UsuarioAutenticado }>();
    return request.user;
  },
);
