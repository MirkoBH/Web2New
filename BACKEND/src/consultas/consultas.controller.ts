import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ResponderConsultaDto } from './dto/responder-consulta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';

@Controller('consultas')
@UseGuards(JwtAuthGuard)
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  // POST /api/consultas — cualquier usuario autenticado puede preguntar
  @Post()
  crear(@UsuarioActual() usuario: any, @Body() dto: CrearConsultaDto) {
    return this.consultasService.crear(usuario.sub, dto);
  }

  // GET /api/consultas/auto/:id — público (sin guard)
  @Get('auto/:id')
  listarPorAuto(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultasService.listarPorAuto(id);
  }

  // GET /api/consultas/mis-consultas — consultas recibidas en tus publicaciones
  @Get('mis-consultas')
  misConsultas(@UsuarioActual() usuario: any) {
    return this.consultasService.listarPorVendedor(usuario.sub);
  }

  // PATCH /api/consultas/:id/responder — el dueño de la publicación responde
  @Patch(':id/responder')
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ResponderConsultaDto,
  ) {
    return this.consultasService.responder(id, usuario.sub, dto);
  }
}
