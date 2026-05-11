import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auto } from './auto.entity';
import { ImagenAuto } from './imagen-auto.entity';
import { StorageService, ArchivoSubido } from './storage.service';
import { ActualizarAutoDto } from './dto/actualizar-auto.dto';
import { FiltrosAutoDto } from './dto/filtros-auto.dto';
import { ResultadoAnalisisIA } from '../ia/ia.service';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Auto) private readonly autosRepo: Repository<Auto>,
    @InjectRepository(ImagenAuto) private readonly imagenesRepo: Repository<ImagenAuto>,
    private readonly storageService: StorageService,
  ) {}

  async crearAprobado(vendedorId: string, datos: Partial<Auto>, analisis: ResultadoAnalisisIA): Promise<Auto> {
    const auto = this.autosRepo.create({
      ...datos, vendedorId, activo: true,
      iaEstado: analisis.estado, iaPuntaje: analisis.puntaje, iaDanios: analisis.danios,
      iaRangoPrecioMin: analisis.rangoPrecioMin, iaRangoPrecioMax: analisis.rangoPrecioMax,
      iaResumen: analisis.resumen, iaAprobado: true,
    });
    return this.autosRepo.save(auto);
  }

  async listar(filtros: FiltrosAutoDto) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 9;
    const skip = (pagina - 1) * limite;
    const qb = this.autosRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.imagenes', 'img')
      .where('a.activo = true')
      .orderBy('img.orden', 'ASC');
    if (filtros.marca)       qb.andWhere('LOWER(a.marca) LIKE :marca',   { marca:  `%${filtros.marca.toLowerCase()}%` });
    if (filtros.modelo)      qb.andWhere('LOWER(a.modelo) LIKE :modelo', { modelo: `%${filtros.modelo.toLowerCase()}%` });
    if (filtros.ubicacion)   qb.andWhere('LOWER(a.ubicacion) LIKE :ubi', { ubi:    `%${filtros.ubicacion.toLowerCase()}%` });
    if (filtros.precioMin)   qb.andWhere('a.precio >= :pMin',            { pMin:   filtros.precioMin });
    if (filtros.precioMax)   qb.andWhere('a.precio <= :pMax',            { pMax:   filtros.precioMax });
    if (filtros.anioMin)     qb.andWhere('a.anio >= :aMin',              { aMin:   filtros.anioMin });
    if (filtros.anioMax)     qb.andWhere('a.anio <= :aMax',              { aMax:   filtros.anioMax });
    if (filtros.combustible) qb.andWhere('a.combustible = :comb',        { comb:   filtros.combustible });
    if (filtros.transmision) qb.andWhere('a.transmision = :trans',       { trans:  filtros.transmision });
    switch (filtros.orden) {
      case 'precio_asc':  qb.addOrderBy('a.precio', 'ASC'); break;
      case 'precio_desc': qb.addOrderBy('a.precio', 'DESC'); break;
      case 'km_asc':      qb.addOrderBy('a.kilometraje', 'ASC'); break;
      default:            qb.addOrderBy('a.createdAt', 'DESC');
    }
    const [datos, total] = await qb.skip(skip).take(limite).getManyAndCount();
    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }

  async obtenerPorId(id: string): Promise<Auto> {
    const auto = await this.autosRepo.findOne({
      where: { id },
      relations: ['vendedor', 'imagenes'],
      order: { imagenes: { orden: 'ASC' } } as any,
    });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    return auto;
  }

  async obtenerPorVendedor(vendedorId: string): Promise<Auto[]> {
    return this.autosRepo.find({
      where: { vendedorId, activo: true },
      relations: ['imagenes'],
      order: { createdAt: 'DESC' },
    });
  }

  async actualizar(id: string, vendedorId: string, dto: ActualizarAutoDto): Promise<Auto> {
    const auto = await this.verificarPropietario(id, vendedorId);
    Object.assign(auto, dto);
    return this.autosRepo.save(auto);
  }

  async subirImagenes(autoId: string, vendedorId: string, archivos: Express.Multer.File[]): Promise<ImagenAuto[]> {
    await this.verificarPropietario(autoId, vendedorId);
    const ordenActual = await this.imagenesRepo.count({ where: { autoId } });
    const subidas: ArchivoSubido[] = await Promise.all(
      archivos.map((a) => this.storageService.subirImagen(autoId, a.buffer, a.mimetype, a.originalname)),
    );
    const entidades = subidas.map((s, i) =>
      this.imagenesRepo.create({ autoId, storagePath: s.storagePath, urlPublica: s.urlPublica, nombre: s.nombre, orden: ordenActual + i }),
    );
    return this.imagenesRepo.save(entidades);
  }

  async reemplazarImagenes(autoId: string, vendedorId: string, archivos: Express.Multer.File[]): Promise<void> {
    await this.verificarPropietario(autoId, vendedorId);
    const viejas = await this.imagenesRepo.find({ where: { autoId } });
    await this.storageService.eliminarCarpetaAuto(autoId);
    if (viejas.length) await this.imagenesRepo.remove(viejas);
    const subidas: ArchivoSubido[] = await Promise.all(
      archivos.map((a) => this.storageService.subirImagen(autoId, a.buffer, a.mimetype, a.originalname)),
    );
    const entidades = subidas.map((s, i) =>
      this.imagenesRepo.create({ autoId, storagePath: s.storagePath, urlPublica: s.urlPublica, nombre: s.nombre, orden: i }),
    );
    await this.imagenesRepo.save(entidades);
  }

  async guardarAnalisisIA(id: string, analisis: ResultadoAnalisisIA): Promise<Auto> {
    const auto = await this.autosRepo.findOneBy({ id });
    if (!auto) throw new NotFoundException('Auto no encontrado');
    auto.iaEstado = analisis.estado; auto.iaPuntaje = analisis.puntaje;
    auto.iaDanios = analisis.danios; auto.iaRangoPrecioMin = analisis.rangoPrecioMin;
    auto.iaRangoPrecioMax = analisis.rangoPrecioMax; auto.iaResumen = analisis.resumen;
    auto.iaAprobado = analisis.aprobado;
    return this.autosRepo.save(auto);
  }

  async eliminarImagen(imagenId: string, vendedorId: string): Promise<void> {
    const imagen = await this.imagenesRepo.findOne({ where: { id: imagenId }, relations: ['auto'] });
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    if (imagen.auto.vendedorId !== vendedorId) throw new ForbiddenException('Sin permiso');
    await this.storageService.eliminarImagen(imagen.storagePath);
    await this.imagenesRepo.remove(imagen);
    const restantes = await this.imagenesRepo.find({ where: { autoId: imagen.autoId }, order: { orden: 'ASC' } });
    for (let i = 0; i < restantes.length; i++) restantes[i].orden = i;
    await this.imagenesRepo.save(restantes);
  }

  async reordenarImagenes(autoId: string, vendedorId: string, orden: string[]): Promise<ImagenAuto[]> {
    await this.verificarPropietario(autoId, vendedorId);
    const imagenes = await this.imagenesRepo.find({ where: { autoId } });
    for (const img of imagenes) { const i = orden.indexOf(img.id); if (i !== -1) img.orden = i; }
    return this.imagenesRepo.save(imagenes);
  }

  async eliminar(id: string, vendedorId: string): Promise<void> {
    const auto = await this.verificarPropietario(id, vendedorId);
    await this.storageService.eliminarCarpetaAuto(id);
    const imagenes = await this.imagenesRepo.find({ where: { autoId: id } });
    if (imagenes.length) await this.imagenesRepo.remove(imagenes);
    await this.autosRepo.remove(auto);
  }

  private async verificarPropietario(id: string, vendedorId: string): Promise<Auto> {
    const auto = await this.autosRepo.findOneBy({ id });
    if (!auto) throw new NotFoundException('Publicación no encontrada');
    if (auto.vendedorId !== vendedorId) throw new ForbiddenException('Sin permiso');
    return auto;
  }
}
