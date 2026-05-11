import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  obtenerPerfil(@UsuarioActual() usuario: any) {
    return this.usersService.buscarPorId(usuario.sub);
  }

  @Patch('me')
  actualizarPerfil(@UsuarioActual() usuario: any, @Body() dto: ActualizarUsuarioDto) {
    return this.usersService.actualizar(usuario.sub, dto);
  }

  @Get(':id')
  obtenerUsuario(@Param('id') id: string) {
    return this.usersService.buscarPorId(id);
  }
}
