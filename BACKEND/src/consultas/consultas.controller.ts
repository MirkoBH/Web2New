import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorator';
import { JwtAuthGuard } from '../comun/guardias/jwt-auth.guard';
import type { UsuarioAutenticado } from '../comun/tipos/usuario-autenticado';
import {
  ConsultaPublica,
  ConsultaRecibida,
  ConsultasService,
} from './consultas.service';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ResponderConsultaDto } from './dto/responder-consulta.dto';

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  /** POST /api/consultas — un comprador pregunta sobre un auto. */
  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: CrearConsultaDto,
  ): Promise<ConsultaPublica> {
    return this.consultasService.crear(usuario.id, dto);
  }

  /** GET /api/consultas/auto/:autoId — público: preguntas y respuestas del auto. */
  @Get('auto/:autoId')
  listarPorAuto(
    @Param('autoId', ParseUUIDPipe) autoId: string,
  ): Promise<ConsultaPublica[]> {
    return this.consultasService.listarPorAuto(autoId);
  }

  /** GET /api/consultas/recibidas — consultas sobre mis publicaciones. */
  @Get('recibidas')
  @UseGuards(JwtAuthGuard)
  listarRecibidas(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ConsultaRecibida[]> {
    return this.consultasService.listarRecibidas(usuario.id);
  }

  /** PATCH /api/consultas/:id/respuesta — el vendedor responde. */
  @Patch(':id/respuesta')
  @UseGuards(JwtAuthGuard)
  responder(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: ResponderConsultaDto,
  ): Promise<ConsultaPublica> {
    return this.consultasService.responder(id, usuario.id, dto);
  }
}
