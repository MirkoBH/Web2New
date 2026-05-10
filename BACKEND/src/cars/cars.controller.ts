import {
  Body,
  Controller,
  Delete,
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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CarsService } from './cars.service';
import { CrearAutoDto } from './dto/crear-auto.dto';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { IaService } from '../ia/ia.service';

// Configuración de almacenamiento de imágenes en disco
const almacenamientoMulter = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const filtroImagenes = (_req: any, file: Express.Multer.File, cb: any) => {
  const tiposPermitidos = /jpeg|jpg|png|webp/;
  const esValido = tiposPermitidos.test(file.mimetype);
  cb(esValido ? null : new Error('Solo se permiten imágenes JPEG, PNG o WEBP'), esValido);
};

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly iaService: IaService,
  ) {}

  // GET /api/cars — listado público con filtros
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

  // GET /api/cars/:id — detalle público de un auto
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

  // PATCH /api/cars/:id — editar publicación propia
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

  // POST /api/cars/:id/upload-images — subir imágenes
  @Post(':id/upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, {
      storage: almacenamientoMulter,
      fileFilter: filtroImagenes,
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB por imagen
    }),
  )
  async subirImagenes(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
    @UploadedFiles() archivos: Express.Multer.File[],
  ) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const urls = archivos.map((f) => `${appUrl}/uploads/${f.filename}`);
    return this.carsService.cargarImagenes(id, usuario.sub, urls);
  }

  // POST /api/cars/:id/analizar-ia — solicitar análisis de IA
  @Post(':id/analizar-ia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendedor')
  async analizarIA(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: any,
  ) {
    const auto = await this.carsService.obtenerPorId(id);
    if (auto.vendedorId !== usuario.sub) {
      throw new Error('No tenés permiso para analizar esta publicación');
    }

    const analisis = await this.iaService.analizarAuto(auto);
    return this.carsService.guardarAnalisisIA(id, analisis);
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
