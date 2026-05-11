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

  // GET /api/cars — público
  @Get()
  listar(@Query() filtros: FiltrosAutoDto) {
    return this.carsService.listar(filtros);
  }

  // GET /api/cars/mis-autos — autos propios
  @Get('mis-autos')
  @UseGuards(JwtAuthGuard)
  misAutos(@UsuarioActual() usuario: any) {
    return this.carsService.obtenerPorVendedor(usuario.sub);
  }

  // GET /api/cars/:id — público
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.obtenerPorId(id);
  }

  // POST /api/cars/publicar — cualquier usuario autenticado puede publicar
  @Post('publicar')
  @UseGuards(JwtAuthGuard)
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

    this.logger.log(`Analizando con IA: ${datoAuto.marca} ${datoAuto.modelo}`);
    const analisis = await this.iaService.analizarConImagenes(datoAuto, archivos);

    if (!analisis.aprobado) {
      this.logger.warn(`IA rechazó: ${datoAuto.marca} ${datoAuto.modelo}`);
      throw new BadRequestException({
        rechazado: true,
        puntaje:   analisis.puntaje,
        danios:    analisis.danios,
        motivo:    analisis.resumen,
        message:   `Publicación rechazada. ${analisis.resumen}`,
      });
    }

    const auto = await this.carsService.crearAprobado(usuario.sub, datoAuto, analisis);
    await this.carsService.subirImagenes(auto.id, usuario.sub, archivos);
    return this.carsService.obtenerPorId(auto.id);
  }

  // POST /api/cars/:id/reeditar — reeditar con nueva IA
  @Post(':id/reeditar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, {
      storage: memoryStorage(),
      fileFilter: filtroImagenes,
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async reeditar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @UploadedFiles() archivos: Express.Multer.File[],
    @Body() body: any,
  ) {
    const autoActual = await this.carsService.obtenerPorId(id);
    if (autoActual.vendedorId !== usuario.sub) {
      throw new ForbiddenException('No tenés permiso para editar esta publicación');
    }

    // Combinar datos actuales con los nuevos (solo los que vinieron)
    const datoAuto = {
      marca:          autoActual.marca,
      modelo:         autoActual.modelo,
      color:          autoActual.color,
      anio:           autoActual.anio,
      kilometraje:    body.kilometraje ? Number(body.kilometraje) : autoActual.kilometraje,
      transmision:    autoActual.transmision,
      combustible:    autoActual.combustible,
      precio:         body.precio ? Number(body.precio) : autoActual.precio,
      ubicacion:      autoActual.ubicacion,
      descripcion:    body.descripcion ? String(body.descripcion).trim() : autoActual.descripcion,
      detallesDanios: body.detallesDanios !== undefined ? String(body.detallesDanios).trim() : autoActual.detallesDanios,
    };

    // Usar imágenes nuevas si se subieron, sino usar las existentes como contexto
    const imagenesParaIA = archivos && archivos.length > 0 ? archivos : [];

    this.logger.log(`Re-analizando con IA: ${datoAuto.marca} ${datoAuto.modelo}`);
    const analisis = await this.iaService.analizarConImagenes(datoAuto, imagenesParaIA);

    if (!analisis.aprobado) {
      this.logger.warn(`IA rechazó la edición de ${id}`);
      throw new BadRequestException({
        rechazado: true,
        puntaje:   analisis.puntaje,
        danios:    analisis.danios,
        motivo:    analisis.resumen,
        message:   `Edición rechazada por la IA. ${analisis.resumen}`,
      });
    }

    // Actualizar datos del auto
    await this.carsService.actualizar(id, usuario.sub, {
      precio:         datoAuto.precio,
      kilometraje:    datoAuto.kilometraje,
      descripcion:    datoAuto.descripcion,
      detallesDanios: datoAuto.detallesDanios,
    });

    // Si hay imágenes nuevas, reemplazar las anteriores
    if (archivos && archivos.length > 0) {
      await this.carsService.reemplazarImagenes(id, usuario.sub, archivos);
    }

    // Guardar nuevo análisis de IA
    return this.carsService.guardarAnalisisIA(id, analisis);
  }

  // PATCH /api/cars/:id — editar solo datos sin IA (precio, km, descripcion)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ActualizarAutoDto,
  ) {
    return this.carsService.actualizar(id, usuario.sub, dto);
  }

  // DELETE /api/cars/:id/imagenes/:imagenId
  @Delete(':id/imagenes/:imagenId')
  @UseGuards(JwtAuthGuard)
  async eliminarImagen(
    @Param('imagenId', ParseUUIDPipe) imagenId: string,
    @UsuarioActual() usuario: any,
  ) {
    await this.carsService.eliminarImagen(imagenId, usuario.sub);
    return { mensaje: 'Imagen eliminada correctamente' };
  }

  // PATCH /api/cars/:id/imagenes/reordenar
  @Patch(':id/imagenes/reordenar')
  @UseGuards(JwtAuthGuard)
  reordenarImagenes(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @Body() dto: ReordenarImagenesDto,
  ) {
    return this.carsService.reordenarImagenes(id, usuario.sub, dto.orden);
  }

  // DELETE /api/cars/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
  ) {
    await this.carsService.eliminar(id, usuario.sub);
    return { mensaje: 'Publicación eliminada correctamente' };
  }
}
