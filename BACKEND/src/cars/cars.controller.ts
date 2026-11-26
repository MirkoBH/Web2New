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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import type { CarDetail, CarSummary, Page } from './cars.responses';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { MAX_IMAGES, MAX_SIZE_BYTES } from './process-images';

/** Las fotos quedan en memoria: se procesan y se suben al bucket, nunca al disco. */
const uploadImages = FilesInterceptor('images', MAX_IMAGES, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: MAX_IMAGES },
});

/** Cada publicación o edición llama a la IA: 10 por hora por usuario/IP. */
const AI_LIMIT = { default: { limit: 10, ttl: 60 * 60_000 } };

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  /** GET /api/cars — listado público con filtros y paginación. */
  @Get()
  list(@Query() filters: FilterCarsDto): Promise<Page<CarSummary>> {
    return this.carsService.list(filters);
  }

  /** GET /api/cars/mine — publicaciones del usuario autenticado. */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<CarSummary[]> {
    return this.carsService.listBySeller(user.id);
  }

  /** GET /api/cars/:id — detalle público. */
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<CarDetail> {
    return this.carsService.getDetail(id);
  }

  /** POST /api/cars — publicar (multipart: datos + campo `images`). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle(AI_LIMIT)
  @UseInterceptors(uploadImages)
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCarDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<CarDetail> {
    return this.carsService.publish(user.id, dto, files);
  }

  /** PATCH /api/cars/:id — editar y volver a tasar (multipart). */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle(AI_LIMIT)
  @UseInterceptors(uploadImages)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCarDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ): Promise<CarDetail> {
    return this.carsService.update(id, user.id, dto, files);
  }

  /** DELETE /api/cars/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.carsService.remove(id, user.id);
  }
}
