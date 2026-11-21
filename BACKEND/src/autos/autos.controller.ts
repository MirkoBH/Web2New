import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorator';
import { JwtAuthGuard } from '../comun/guardias/jwt-auth.guard';
import type { UsuarioAutenticado } from '../comun/tipos/usuario-autenticado';
import type { AutoDetalle, AutoResumen, Pagina } from './autos.respuestas';
import { AutosService } from './autos.service';
import { CrearAutoDto } from './dto/crear-auto.dto';
import { EditarAutoDto } from './dto/editar-auto.dto';
import { FiltrarAutosDto } from './dto/filtrar-autos.dto';
import { MAXIMO_IMAGENES, TAMANIO_MAXIMO_BYTES } from './procesar-imagenes';

/** Las fotos quedan en memoria: se procesan y se suben al bucket, nunca al disco. */
const subirImagenes = FilesInterceptor('imagenes', MAXIMO_IMAGENES, {
  storage: memoryStorage(),
  limits: { fileSize: TAMANIO_MAXIMO_BYTES, files: MAXIMO_IMAGENES },
});

/** Cada publicación o edición llama a la IA: 10 por hora por usuario/IP. */
const LIMITE_IA = { default: { limit: 10, ttl: 60 * 60_000 } };

@Controller('autos')
export class AutosController {
  constructor(private readonly autosService: AutosService) {}

  /** GET /api/autos — listado público con filtros y paginación. */
  @Get()
  listar(@Query() filtros: FiltrarAutosDto): Promise<Pagina<AutoResumen>> {
    return this.autosService.listar(filtros);
  }

  /** GET /api/autos/mios — publicaciones del usuario autenticado. */
  @Get('mios')
  @UseGuards(JwtAuthGuard)
  listarMios(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<AutoResumen[]> {
    return this.autosService.listarDelVendedor(usuario.id);
  }

  /** GET /api/autos/:id — detalle público. */
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<AutoDetalle> {
    return this.autosService.obtenerDetalle(id);
  }

  /** POST /api/autos — publicar (multipart: datos + campo `imagenes`). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle(LIMITE_IA)
  @UseInterceptors(subirImagenes)
  publicar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: CrearAutoDto,
    @UploadedFiles() archivos: Express.Multer.File[] = [],
  ): Promise<AutoDetalle> {
    return this.autosService.publicar(usuario.id, dto, archivos);
  }

  /** PATCH /api/autos/:id — editar y volver a tasar (multipart). */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle(LIMITE_IA)
  @UseInterceptors(subirImagenes)
  editar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: EditarAutoDto,
    @UploadedFiles() archivos: Express.Multer.File[] = [],
  ): Promise<AutoDetalle> {
    return this.autosService.editar(id, usuario.id, dto, archivos);
  }

  /** DELETE /api/autos/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.autosService.eliminar(id, usuario.id);
  }
}
