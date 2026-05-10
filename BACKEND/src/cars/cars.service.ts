import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auto } from './auto.entity';
import { CrearAutoDto } from './dto/crear-auto.dto';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Auto)
    private readonly autosRepo: Repository<Auto>,
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
      .where('a.activo = true');

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
      case 'precio_asc': qb.orderBy('a.precio', 'ASC'); break;
      case 'precio_desc': qb.orderBy('a.precio', 'DESC'); break;
      case 'km_asc': qb.orderBy('a.kilometraje', 'ASC'); break;
      default: qb.orderBy('a.createdAt', 'DESC');
    }

    const [datos, total] = await qb.skip(skip).take(limite).getManyAndCount();

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ── Obtener un auto por ID ─────────────────────────────────
  async obtenerPorId(id: string): Promise<Auto> {
    const auto = await this.autosRepo.findOne({
      where: { id, activo: true },
      relations: ['vendedor'],
    });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    return auto;
  }

  // ── Autos de un vendedor ───────────────────────────────────
  async obtenerPorVendedor(vendedorId: string): Promise<Auto[]> {
    return this.autosRepo.find({
      where: { vendedorId, activo: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Actualizar ─────────────────────────────────────────────
  async actualizar(id: string, vendedorId: string, dto: ActualizarAutoDto): Promise<Auto> {
    const auto = await this.verificarPropietario(id, vendedorId);
    Object.assign(auto, dto);
    return this.autosRepo.save(auto);
  }

  // ── Cargar imágenes ────────────────────────────────────────
  async cargarImagenes(id: string, vendedorId: string, urls: string[]): Promise<Auto> {
    const auto = await this.verificarPropietario(id, vendedorId);
    auto.imagenes = [...(auto.imagenes || []), ...urls];
    return this.autosRepo.save(auto);
  }

  // ── Guardar resultado de análisis IA ───────────────────────
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

    auto.iaEstado = analisis.estado;
    auto.iaPuntaje = analisis.puntaje;
    auto.iaDanios = analisis.danios;
    auto.iaRangoPrecioMin = analisis.rangoPrecioMin;
    auto.iaRangoPrecioMax = analisis.rangoPrecioMax;
    auto.iaResumen = analisis.resumen;
    auto.iaAprobado = analisis.aprobado;

    return this.autosRepo.save(auto);
  }

  // ── Eliminar (soft delete marcando inactivo) ───────────────
  async eliminar(id: string, vendedorId: string): Promise<void> {
    const auto = await this.verificarPropietario(id, vendedorId);
    auto.activo = false;
    await this.autosRepo.save(auto);
  }

  // ── Verificar que el auto pertenece al vendedor ────────────
  private async verificarPropietario(id: string, vendedorId: string): Promise<Auto> {
    const auto = await this.autosRepo.findOneBy({ id });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    if (auto.vendedorId !== vendedorId) throw new ForbiddenException('No tenés permiso sobre esta publicación');
    return auto;
  }
}
