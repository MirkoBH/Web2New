import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { AutenticacionService, Sesion } from './autenticacion.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';

/** Límite más estricto para frenar ataques de fuerza bruta: 5 intentos por minuto. */
const LIMITE_AUTENTICACION = { default: { limit: 5, ttl: 60_000 } };

@Controller('autenticacion')
@Throttle(LIMITE_AUTENTICACION)
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  /** POST /api/autenticacion/registro */
  @Post('registro')
  registrar(@Body() dto: CrearUsuarioDto): Promise<Sesion> {
    return this.autenticacionService.registrar(dto);
  }

  /** POST /api/autenticacion/inicio-sesion */
  @Post('inicio-sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() dto: IniciarSesionDto): Promise<Sesion> {
    return this.autenticacionService.iniciarSesion(dto);
  }
}
