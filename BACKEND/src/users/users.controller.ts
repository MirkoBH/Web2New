import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/me — perfil del usuario autenticado
  @Get('me')
  obtenerPerfil(@UsuarioActual() usuario: any) {
    return this.usersService.buscarPorId(usuario.sub);
  }

  // PATCH /api/users/me — actualizar perfil
  @Patch('me')
  actualizarPerfil(
    @UsuarioActual() usuario: any,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usersService.actualizar(usuario.sub, dto);
  }

  // GET /api/users/:id — datos públicos de un vendedor
  @Get(':id')
  obtenerUsuario(@Param('id') id: string) {
    return this.usersService.buscarPorId(id);
  }
}
