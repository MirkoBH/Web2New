import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
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
import { CrearAutoDto } from './dto/crear-auto.dto';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { IaService } from '../ia/ia.service';

class ReordenarImagenesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orden: string[];
}

const filtroImagenes = (_req: any, file: Express.Multer.File, cb: any) => {
  const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const valido = permitidos.includes(file.mimetype);
  cb(valido ? null : new Error('Solo se permiten imágenes JPEG, PNG o WEBP'), valido);
};

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly iaService: IaService,
  ) {}

  // GET /api/cars — listado público con filtros y paginación
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

  // GET /api/cars/:id — detalle público con imágenes ordenadas
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.obtenerPorId(id);
  }

  // POST /api/cars — crear publicación (solo vendedores)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  crear(@UsuarioActual() usuario: any, @Body() dto: CrearAutoDto) {
    return this.carsService.crear(usuario.sub, dto);
  }

  // PATCH /api/cars/:id — editar datos del auto
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

  // POST /api/cars/:id/upload-images
  // Sube archivos al bucket de Supabase Storage y los registra en imagenes_auto
  @Post(':id/upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, {
      storage: memoryStorage(),
      fileFilter: filtroImagenes,
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  subirImagenes(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @UploadedFiles() archivos: Express.Multer.File[],
  ) {
    return this.carsService.subirImagenes(id, usuario.sub, archivos);
  }

  // DELETE /api/cars/:id/imagenes/:imagenId — eliminar una imagen
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

  // POST /api/cars/:id/analizar-ia — análisis con Gemini
  @Post(':id/analizar-ia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  async analizarIA(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
  ) {
    const auto = await this.carsService.obtenerPorId(id);
    if (auto.vendedorId !== usuario.sub) {
      throw new ForbiddenException('No tenés permiso para analizar esta publicación');
    }
    const analisis = await this.iaService.analizarAuto(auto);
    return this.carsService.guardarAnalisisIA(id, analisis);
  }

  // DELETE /api/cars/:id — eliminar publicación + imágenes del bucket
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
