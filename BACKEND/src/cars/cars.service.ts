import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auto } from './auto.entity';
import { ImagenAuto } from './imagen-auto.entity';
import { StorageService, ArchivoSubido } from './storage.service';
import { CrearAutoDto } from './dto/crear-auto.dto';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Auto)
    private readonly autosRepo: Repository<Auto>,
    @InjectRepository(ImagenAuto)
    private readonly imagenesRepo: Repository<ImagenAuto>,
    private readonly storageService: StorageService,
  ) {}

  // ── Crear publicación ──────────────────────────────────────
  async crear(vendedorId: string, dto: CrearAutoDto): Promise<Auto> {
    const auto = this.autosRepo.create({ ...dto, vendedorId, activo: true });
    return this.autosRepo.save(auto);
  }

  // ── Listar con filtros y paginación ───────────────────────
  async listar(filtros: FiltrosAutoDto) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 9;
    const skip = (pagina - 1) * limite;

    const qb = this.autosRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.imagenes', 'img')
      .where('a.activo = true')
      .orderBy('img.orden', 'ASC');

    if (filtros.marca) qb.andWhere('LOWER(a.marca) LIKE :marca', { marca: `%${filtros.marca.toLowerCase()}%` });
    if (filtros.modelo) qb.andWhere('LOWER(a.modelo) LIKE :modelo', { modelo: `%${filtros.modelo.toLowerCase()}%` });
    if (filtros.ubicacion) qb.andWhere('LOWER(a.ubicacion) LIKE :ubi', { ubi: `%${filtros.ubicacion.toLowerCase()}%` });
    if (filtros.precioMin) qb.andWhere('a.precio >= :pMin', { pMin: filtros.precioMin });
    if (filtros.precioMax) qb.andWhere('a.precio <= :pMax', { pMax: filtros.precioMax });
    if (filtros.anioMin) qb.andWhere('a.anio >= :aMin', { aMin: filtros.anioMin });
    if (filtros.anioMax) qb.andWhere('a.anio <= :aMax', { aMax: filtros.anioMax });
    if (filtros.combustible) qb.andWhere('a.combustible = :comb', { comb: filtros.combustible });
    if (filtros.transmision) qb.andWhere('a.transmision = :trans', { trans: filtros.transmision });

    switch (filtros.orden) {
      case 'precio_asc':  qb.addOrderBy('a.precio', 'ASC'); break;
      case 'precio_desc': qb.addOrderBy('a.precio', 'DESC'); break;
      case 'km_asc':      qb.addOrderBy('a.kilometraje', 'ASC'); break;
      default:            qb.addOrderBy('a.createdAt', 'DESC');
    }

    const [datos, total] = await qb.skip(skip).take(limite).getManyAndCount();

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }

  // ── Obtener detalle de un auto ─────────────────────────────
  async obtenerPorId(id: string): Promise<Auto> {
    const auto = await this.autosRepo.findOne({
      where: { id, activo: true },
      relations: ['vendedor', 'imagenes'],
      order: { imagenes: { orden: 'ASC' } } as any,
    });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    return auto;
  }

  // ── Autos propios del vendedor ─────────────────────────────
  async obtenerPorVendedor(vendedorId: string): Promise<Auto[]> {
    return this.autosRepo.find({
      where: { vendedorId, activo: true },
      relations: ['imagenes'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Actualizar datos del auto ──────────────────────────────
  async actualizar(id: string, vendedorId: string, dto: ActualizarAutoDto): Promise<Auto> {
    const auto = await this.verificarPropietario(id, vendedorId);
    Object.assign(auto, dto);
    return this.autosRepo.save(auto);
  }

  // ── Subir imágenes: bucket + registro en tabla ─────────────
  async subirImagenes(
    autoId: string,
    vendedorId: string,
    archivos: Express.Multer.File[],
  ): Promise<ImagenAuto[]> {
    // Verificar que el auto pertenece al vendedor
    await this.verificarPropietario(autoId, vendedorId);

    // Determinar el orden de inicio (después de las que ya existen)
    const ordenActual = await this.imagenesRepo.count({ where: { autoId } });

    // Subir cada archivo al bucket en paralelo
    const subidas: ArchivoSubido[] = await Promise.all(
      archivos.map((archivo) =>
        this.storageService.subirImagen(
          autoId,
          archivo.buffer,
          archivo.mimetype,
          archivo.originalname,
        ),
      ),
    );

    // Registrar cada imagen en la tabla imagenes_auto
    const entidades = subidas.map((subida, i) =>
      this.imagenesRepo.create({
        autoId,
        storagePath: subida.storagePath,
        urlPublica: subida.urlPublica,
        nombre: subida.nombre,
        orden: ordenActual + i,
      }),
    );

    return this.imagenesRepo.save(entidades);
  }

  // ── Eliminar una imagen individual ─────────────────────────
  async eliminarImagen(imagenId: string, vendedorId: string): Promise<void> {
    const imagen = await this.imagenesRepo.findOne({
      where: { id: imagenId },
      relations: ['auto'],
    });
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    if (imagen.auto.vendedorId !== vendedorId) {
      throw new ForbiddenException('No tenés permiso para eliminar esta imagen');
    }

    // Eliminar del bucket
    await this.storageService.eliminarImagen(imagen.storagePath);
    // Eliminar registro de la tabla
    await this.imagenesRepo.remove(imagen);

    // Reordenar las imágenes restantes del auto
    const restantes = await this.imagenesRepo.find({
      where: { autoId: imagen.autoId },
      order: { orden: 'ASC' },
    });
    for (let i = 0; i < restantes.length; i++) {
      restantes[i].orden = i;
    }
    await this.imagenesRepo.save(restantes);
  }

  // ── Reordenar imágenes de un auto ─────────────────────────
  async reordenarImagenes(
    autoId: string,
    vendedorId: string,
    orden: string[], // array de IDs de imagen en el nuevo orden deseado
  ): Promise<ImagenAuto[]> {
    await this.verificarPropietario(autoId, vendedorId);

    const imagenes = await this.imagenesRepo.find({ where: { autoId } });

    for (const imagen of imagenes) {
      const nuevoOrden = orden.indexOf(imagen.id);
      if (nuevoOrden !== -1) imagen.orden = nuevoOrden;
    }

    return this.imagenesRepo.save(imagenes);
  }

  // ── Guardar resultado análisis IA ──────────────────────────
  async guardarAnalisisIA(id: string, analisis: {
    estado: string;
    puntaje: number;
    danios: string;
    rangoPrecioMin: number;
    rangoPrecioMax: number;
    resumen: string;
    aprobado: boolean;
  }): Promise<Auto> {
    const auto = await this.autosRepo.findOneBy({ id });
    if (!auto) throw new NotFoundException('Auto no encontrado');

    auto.iaEstado      = analisis.estado;
    auto.iaPuntaje     = analisis.puntaje;
    auto.iaDanios      = analisis.danios;
    auto.iaRangoPrecioMin = analisis.rangoPrecioMin;
    auto.iaRangoPrecioMax = analisis.rangoPrecioMax;
    auto.iaResumen     = analisis.resumen;
    auto.iaAprobado    = analisis.aprobado;

    return this.autosRepo.save(auto);
  }

  // ── Eliminar publicación (soft delete + limpia bucket) ─────
  async eliminar(id: string, vendedorId: string): Promise<void> {
    const auto = await this.verificarPropietario(id, vendedorId);
    // Eliminar todas las imágenes del bucket del auto
    await this.storageService.eliminarCarpetaAuto(id);
    // Soft delete
    auto.activo = false;
    await this.autosRepo.save(auto);
  }

  // ── Verificar propietario ──────────────────────────────────
  private async verificarPropietario(id: string, vendedorId: string): Promise<Auto> {
    const auto = await this.autosRepo.findOneBy({ id });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    if (auto.vendedorId !== vendedorId) {
      throw new ForbiddenException('No tenés permiso sobre esta publicación');
    }
    return auto;
  }
}
