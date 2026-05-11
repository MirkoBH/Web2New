import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
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
import { memoryStorage } from 'multer';
import { IsArray, IsUUID } from 'class-validator';
import { CarsService } from './cars.service';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { IaService } from '../ia/ia.service';
import { TipoCombustible, TipoTransmision } from './auto.entity';

class ReordenarImagenesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orden: string[];
}

const filtroImagenes = (_req: any, file: Express.Multer.File, cb: any) => {
  const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  cb(
    permitidos.includes(file.mimetype) ? null : new Error('Solo se permiten imágenes JPEG, PNG o WEBP'),
    permitidos.includes(file.mimetype),
  );
};

@Controller('cars')
export class CarsController {
  private readonly logger = new Logger(CarsController.name);

  constructor(
    private readonly carsService: CarsService,
    private readonly iaService: IaService,
  ) {}

  // GET /api/cars — listado público (solo aprobados)
  @Get()
  listar(@Query() filtros: FiltrosAutoDto) {
    return this.carsService.listar(filtros);
  }

  // GET /api/cars/mis-autos — autos del vendedor autenticado
  @Get('mis-autos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  misAutos(@UsuarioActual() usuario: any) {
    return this.carsService.obtenerPorVendedor(usuario.sub);
  }

  // GET /api/cars/:id — detalle de un auto
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.obtenerPorId(id);
  }

  // ─────────────────────────────────────────────────────────────
  // POST /api/cars/publicar
  // Endpoint unificado: recibe datos + imágenes en un solo request
  // Flujo:
  //   1. IA analiza los buffers en memoria (sin tocar DB ni Storage)
  //   2. Si rechaza → error 400, nada queda guardado
  //   3. Si aprueba → guarda auto en DB + sube imágenes al bucket
  // ─────────────────────────────────────────────────────────────
  @Post('publicar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, {
      storage: memoryStorage(),
      fileFilter: filtroImagenes,
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async publicar(
    @UsuarioActual() usuario: any,
    @UploadedFiles() archivos: Express.Multer.File[],
    @Body() body: any,
  ) {
    if (!archivos || archivos.length === 0) {
      throw new BadRequestException('Debés subir al menos una imagen.');
    }

    const datoAuto = {
      marca:          String(body.marca || '').trim(),
      modelo:         String(body.modelo || '').trim(),
      color:          String(body.color || '').trim(),
      anio:           Number(body.anio),
      kilometraje:    Number(body.kilometraje),
      transmision:    body.transmision as TipoTransmision,
      combustible:    body.combustible as TipoCombustible,
      precio:         Number(body.precio),
      ubicacion:      String(body.ubicacion || '').trim(),
      descripcion:    String(body.descripcion || '').trim(),
      detallesDanios: String(body.detallesDanios || '').trim(),
    };

    // ── 1. IA analiza buffers en memoria — sin tocar DB ────────
    this.logger.log(`Analizando con IA antes de guardar: ${datoAuto.marca} ${datoAuto.modelo}`);
    const analisis = await this.iaService.analizarConImagenes(datoAuto, archivos);

    // ── 2. IA rechazó → error, nada queda guardado ─────────────
    if (!analisis.aprobado) {
      this.logger.warn(`IA rechazó: ${datoAuto.marca} ${datoAuto.modelo} — ${analisis.resumen}`);
      throw new BadRequestException({
        rechazado: true,
        puntaje:   analisis.puntaje,
        danios:    analisis.danios,
        motivo:    analisis.resumen,
        message:   `Publicación rechazada. ${analisis.resumen}`,
      });
    }

    // ── 3. IA aprobó → guardar auto en DB ──────────────────────
    this.logger.log(`IA aprobó. Guardando en DB...`);
    const auto = await this.carsService.crearAprobado(usuario.sub, datoAuto, analisis);

    // ── 4. Subir imágenes al bucket de Supabase ─────────────────
    this.logger.log(`Subiendo ${archivos.length} imagen(es) al bucket...`);
    await this.carsService.subirImagenes(auto.id, usuario.sub, archivos);

    // ── 5. Devolver auto completo con imágenes ──────────────────
    return this.carsService.obtenerPorId(auto.id);
  }

  // PATCH /api/cars/:id — editar datos
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ActualizarAutoDto,
  ) {
    return this.carsService.actualizar(id, usuario.sub, dto);
  }

  // DELETE /api/cars/:id/imagenes/:imagenId — eliminar imagen
  @Delete(':id/imagenes/:imagenId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  async eliminarImagen(
    @Param('imagenId', ParseUUIDPipe) imagenId: string,
    @UsuarioActual() usuario: any,
  ) {
    await this.carsService.eliminarImagen(imagenId, usuario.sub);
    return { mensaje: 'Imagen eliminada correctamente' };
  }

  // PATCH /api/cars/:id/imagenes/reordenar — reordenar galería
  @Patch(':id/imagenes/reordenar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  reordenarImagenes(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ReordenarImagenesDto,
  ) {
    return this.carsService.reordenarImagenes(id, usuario.sub, dto.orden);
  }

  // DELETE /api/cars/:id — eliminar publicación propia
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  async eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
  ) {
    await this.carsService.eliminar(id, usuario.sub);
    return { mensaje: 'Publicación eliminada correctamente' };
  }
}
