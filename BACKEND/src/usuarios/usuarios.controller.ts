import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorator';
import { JwtAuthGuard } from '../comun/guardias/jwt-auth.guard';
import type { UsuarioAutenticado } from '../comun/tipos/usuario-autenticado';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { aPerfil, PerfilUsuario } from './usuario.entity';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /** GET /api/usuarios/yo — perfil del usuario autenticado. */
  @Get('yo')
  async obtenerPerfil(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<PerfilUsuario> {
    return aPerfil(await this.usuariosService.buscarPorId(usuario.id));
  }

  /** PATCH /api/usuarios/yo — actualizar nombre y teléfono. */
  @Patch('yo')
  async actualizarPerfil(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: ActualizarUsuarioDto,
  ): Promise<PerfilUsuario> {
    return aPerfil(await this.usuariosService.actualizar(usuario.id, dto));
  }
}
