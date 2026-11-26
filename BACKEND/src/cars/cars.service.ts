import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { AiService, AI_UNAVAILABLE_MESSAGE } from '../ai/ai.service';
import { MAX_MOSAIC_PHOTOS } from '../ai/mosaic';
import type {
  AppraisalInput,
  AppraisalImage,
  AppraisalResult,
} from '../ai/ai.types';
import { StorageService, StoredFile } from './storage.service';
import { Car } from './car.entity';
import {
  toDetail,
  toSummary,
  CarDetail,
  CarSummary,
  Page,
} from './cars.responses';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto, SortOption } from './dto/filter-cars.dto';
import { CarImage } from './car-image.entity';
import {
  shrinkForAi,
  ProcessedImage,
  MAX_IMAGES,
  MIN_IMAGES,
  processImages,
} from './process-images';

const SORT_SQL: Record<SortOption, [string, 'ASC' | 'DESC']> = {
  newest: ['car.createdAt', 'DESC'],
  price_asc: ['car.price', 'ASC'],
  price_desc: ['car.price', 'DESC'],
  mileage_asc: ['car.mileage', 'ASC'],
};

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectRepository(Car)
    private readonly cars: Repository<Car>,
    @InjectRepository(CarImage)
    private readonly images: Repository<CarImage>,
    @InjectDataSource()
    private readonly database: DataSource,
    private readonly aiService: AiService,
    private readonly storage: StorageService,
  ) {}

  async list(filters: FilterCarsDto): Promise<Page<CarSummary>> {
    const query = this.cars.createQueryBuilder('car');
    applyFilters(query, filters);

    const [field, direction] = SORT_SQL[filters.sort];
    // Primero se pagina sobre `autos` solamente y después se cargan las fotos;
    // si se hace con un JOIN, el orden y el LIMIT se aplican sobre las filas
    // de imágenes y la paginación sale mal.
    const [cars, total] = await query
      .orderBy(field, direction)
      .addOrderBy('car.id', 'ASC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    await this.loadImages(cars);
    return {
      data: cars.map(toSummary),
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  }

  async listBySeller(sellerId: string): Promise<CarSummary[]> {
    const cars = await this.cars.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
    await this.loadImages(cars);
    return cars.map(toSummary);
  }

  async getDetail(id: string): Promise<CarDetail> {
    const car = await this.cars.findOne({
      where: { id },
      relations: { seller: true, images: true },
    });
    if (!car) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return toDetail(car);
  }

  /** Datos mínimos de un auto, para validar reglas en otros módulos. */
  async findBasic(id: string): Promise<Car> {
    const car = await this.cars.findOneBy({ id });
    if (!car) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return car;
  }

  /**
   * Publica un auto. Orden de los pasos:
   * 1. Validar y achicar las fotos.
   * 2. Tasar con IA. Si falla, se corta acá y no se guarda nada (503).
   * 3. Subir las fotos al bucket.
   * 4. Guardar auto e imágenes en una transacción.
   * Si 3 o 4 fallan, se borran las fotos ya subidas.
   */
  async publish(
    sellerId: string,
    dto: CreateCarDto,
    files: Express.Multer.File[],
  ): Promise<CarDetail> {
    validateImageCount(files);
    const processed = await processImages(files);
    const appraisal = await this.aiService.appraise(
      dto,
      toAppraisalImages(processed),
    );

    const carId = randomUUID();
    const uploadedFiles = await this.uploadImages(carId, processed);
    try {
      await this.database.transaction(async (manager) => {
        await manager.insert(Car, {
          id: carId,
          sellerId,
          brand: dto.brand,
          model: dto.model,
          color: dto.color || null,
          year: dto.year,
          mileage: dto.mileage,
          transmission: dto.transmission,
          fuel: dto.fuel,
          price: dto.price,
          location: dto.location,
          description: dto.description,
          damageDetails: dto.damageDetails || null,
          ...appraisalColumns(appraisal),
        });
        await manager.insert(CarImage, imageRows(carId, uploadedFiles));
      });
    } catch (error) {
      await this.storage.remove(uploadedFiles.map((s) => s.filePath));
      throw error;
    }

    return this.getDetail(carId);
  }

  /**
   * Edita precio, kilometraje, descripción o daños y vuelve a tasar con IA.
   * Si se mandan fotos nuevas, reemplazan a todas las anteriores.
   * Si la IA falla, la publicación queda como estaba.
   */
  async update(
    id: string,
    sellerId: string,
    dto: UpdateCarDto,
    files: Express.Multer.File[],
  ): Promise<CarDetail> {
    const car = await this.findOwn(id, sellerId);
    if (files.length > 0) validateImageCount(files);

    const data: AppraisalInput = {
      ...car,
      price: dto.price ?? car.price,
      mileage: dto.mileage ?? car.mileage,
      description: dto.description ?? car.description,
      damageDetails:
        dto.damageDetails !== undefined
          ? dto.damageDetails || null
          : car.damageDetails,
    };

    const previousImages = await this.images.find({
      where: { carId: id },
      order: { position: 'ASC' },
    });
    const processed = files.length > 0 ? await processImages(files) : [];
    const appraisalImages =
      processed.length > 0
        ? toAppraisalImages(processed)
        : await this.downloadForAppraisal(previousImages);

    const appraisal = await this.aiService.appraise(data, appraisalImages);

    const uploadedFiles = await this.uploadImages(id, processed);
    try {
      await this.database.transaction(async (manager) => {
        await manager.update(Car, id, {
          price: data.price,
          mileage: data.mileage,
          description: data.description,
          damageDetails: data.damageDetails,
          ...appraisalColumns(appraisal),
        });
        if (uploadedFiles.length > 0) {
          await manager.delete(CarImage, {
            id: In(previousImages.map((i) => i.id)),
          });
          await manager.insert(CarImage, imageRows(id, uploadedFiles));
        }
      });
    } catch (error) {
      await this.storage.remove(uploadedFiles.map((s) => s.filePath));
      throw error;
    }

    if (uploadedFiles.length > 0) {
      await this.storage.remove(previousImages.map((i) => i.filePath));
    }
    return this.getDetail(id);
  }

  /** Borra la publicación, sus imágenes y sus consultas (cascada en la base). */
  async remove(id: string, sellerId: string): Promise<void> {
    await this.findOwn(id, sellerId);
    const images = await this.images.findBy({ carId: id });
    await this.cars.delete(id);
    await this.storage.remove(images.map((i) => i.filePath));
  }

  private async findOwn(id: string, sellerId: string): Promise<Car> {
    const car = await this.findBasic(id);
    if (car.sellerId !== sellerId) {
      throw new ForbiddenException(
        'Solo el vendedor puede modificar esta publicación',
      );
    }
    return car;
  }

  /**
   * Al editar sin fotos nuevas se vuelven a tasar las guardadas: se descargan
   * y se achican antes de armar el mosaico.
   */
  private async downloadForAppraisal(
    images: CarImage[],
  ): Promise<AppraisalImage[]> {
    const firstImages = images.slice(0, MAX_MOSAIC_PHOTOS);
    try {
      return await Promise.all(
        firstImages.map(async (image) => {
          const response = await fetch(image.publicUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const original = Buffer.from(await response.arrayBuffer());
          return { data: await shrinkForAi(original), mime: 'image/jpeg' };
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudieron leer las fotos guardadas: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }
  }

  private async loadImages(cars: Car[]): Promise<void> {
    if (cars.length === 0) return;
    const images = await this.images.find({
      where: { carId: In(cars.map((a) => a.id)) },
      order: { position: 'ASC' },
    });
    for (const car of cars) {
      car.images = images.filter((image) => image.carId === car.id);
    }
  }

  /** Sube las fotos una por una; si alguna falla, borra las que ya subió. */
  private async uploadImages(
    carId: string,
    processed: ProcessedImage[],
  ): Promise<StoredFile[]> {
    const uploadedFiles: StoredFile[] = [];
    try {
      for (const image of processed) {
        uploadedFiles.push(await this.storage.upload(carId, image.stored));
      }
      return uploadedFiles;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      await this.storage.remove(uploadedFiles.map((s) => s.filePath));
      throw error;
    }
  }
}

function applyFilters(
  query: SelectQueryBuilder<Car>,
  filters: FilterCarsDto,
): void {
  if (filters.search) {
    // Cada palabra tiene que aparecer en la marca o en el modelo.
    filters.search
      .split(/\s+/)
      .slice(0, 5)
      .forEach((word, i) => {
        query.andWhere(
          `(car.brand ILIKE :search${i} OR car.model ILIKE :search${i})`,
          { [`search${i}`]: `%${escapeLike(word)}%` },
        );
      });
  }

  const textFilters = {
    brand: filters.brand,
    model: filters.model,
    location: filters.location,
  };
  for (const [field, value] of Object.entries(textFilters)) {
    if (value) {
      query.andWhere(`car.${field} ILIKE :${field}`, {
        [field]: `%${escapeLike(value)}%`,
      });
    }
  }

  const ranges: [string, number | undefined, number | undefined][] = [
    ['price', filters.minPrice, filters.maxPrice],
    ['year', filters.minYear, filters.maxYear],
    ['mileage', filters.minKm, filters.maxKm],
  ];
  for (const [field, min, max] of ranges) {
    if (min !== undefined) {
      query.andWhere(`car.${field} >= :${field}Min`, {
        [`${field}Min`]: min,
      });
    }
    if (max !== undefined) {
      query.andWhere(`car.${field} <= :${field}Max`, {
        [`${field}Max`]: max,
      });
    }
  }

  if (filters.fuel) {
    query.andWhere('car.fuel = :fuel', {
      fuel: filters.fuel,
    });
  }
  if (filters.transmission) {
    query.andWhere('car.transmission = :transmission', {
      transmission: filters.transmission,
    });
  }
}

/** Evita que `%` o `_` escritos por el usuario funcionen como comodines. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function validateImageCount(files: Express.Multer.File[]): void {
  if (files.length < MIN_IMAGES) {
    throw new BadRequestException(`Subí al menos ${MIN_IMAGES} fotos del auto`);
  }
  if (files.length > MAX_IMAGES) {
    throw new BadRequestException(`Podés subir hasta ${MAX_IMAGES} fotos`);
  }
}

function toAppraisalImages(processed: ProcessedImage[]): AppraisalImage[] {
  return processed.map((image) => ({
    data: image.forAi,
    mime: 'image/jpeg',
  }));
}

function appraisalColumns(appraisal: AppraisalResult): Partial<Car> {
  return {
    aiCondition: appraisal.condition,
    aiScore: appraisal.score,
    aiDamages: appraisal.damages,
    aiMinPrice: appraisal.minPrice,
    aiMaxPrice: appraisal.maxPrice,
    aiSummary: appraisal.summary,
  };
}

function imageRows(
  carId: string,
  uploadedFiles: StoredFile[],
): Partial<CarImage>[] {
  return uploadedFiles.map((uploadedFile, position) => ({
    carId,
    ...uploadedFile,
    position,
  }));
}
