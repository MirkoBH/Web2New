import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ResponderConsultaDto } from './dto/responder-consulta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';

@Controller('consultas')
@UseGuards(JwtAuthGuard)
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  // POST /api/consultas — crear consulta (compradores)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('comprador')
  crear(@UsuarioActual() usuario: any, @Body() dto: CrearConsultaDto) {
    return this.consultasService.crear(usuario.sub, dto);
  }

  // GET /api/consultas/auto/:id — consultas públicas de un auto
  @Get('auto/:id')
  listarPorAuto(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultasService.listarPorAuto(id);
  }

  // GET /api/consultas/mis-consultas — consultas recibidas (vendedor)
  @Get('mis-consultas')
  @UseGuards(RolesGuard)
  @Roles('vendedor')
  misConsultas(@UsuarioActual() usuario: any) {
    return this.consultasService.listarPorVendedor(usuario.sub);
  }

  // PATCH /api/consultas/:id/responder — responder consulta
  @Patch(':id/responder')
  @UseGuards(RolesGuard)
  @Roles('vendedor')
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ResponderConsultaDto,
  ) {
    return this.consultasService.responder(id, usuario.sub, dto);
  }
}
