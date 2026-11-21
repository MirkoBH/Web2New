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
import { IaService, MENSAJE_IA_NO_DISPONIBLE } from '../ia/ia.service';
import { MAXIMO_FOTOS_MOSAICO } from '../ia/mosaico';
import type {
  DatosTasacion,
  ImagenParaTasar,
  ResultadoTasacion,
} from '../ia/ia.types';
import { AlmacenamientoService, ArchivoSubido } from './almacenamiento.service';
import { Auto } from './auto.entity';
import {
  aDetalle,
  aResumen,
  AutoDetalle,
  AutoResumen,
  Pagina,
} from './autos.respuestas';
import { CrearAutoDto } from './dto/crear-auto.dto';
import { EditarAutoDto } from './dto/editar-auto.dto';
import { FiltrarAutosDto, Orden } from './dto/filtrar-autos.dto';
import { ImagenAuto } from './imagen-auto.entity';
import {
  achicarParaIa,
  ImagenProcesada,
  MAXIMO_IMAGENES,
  MINIMO_IMAGENES,
  procesarImagenes,
} from './procesar-imagenes';

const ORDEN_SQL: Record<Orden, [string, 'ASC' | 'DESC']> = {
  reciente: ['auto.creadoEn', 'DESC'],
  precio_asc: ['auto.precio', 'ASC'],
  precio_desc: ['auto.precio', 'DESC'],
  km_asc: ['auto.kilometraje', 'ASC'],
};

@Injectable()
export class AutosService {
  private readonly logger = new Logger(AutosService.name);

  constructor(
    @InjectRepository(Auto)
    private readonly autos: Repository<Auto>,
    @InjectRepository(ImagenAuto)
    private readonly imagenes: Repository<ImagenAuto>,
    @InjectDataSource()
    private readonly baseDeDatos: DataSource,
    private readonly iaService: IaService,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  async listar(filtros: FiltrarAutosDto): Promise<Pagina<AutoResumen>> {
    const consulta = this.autos.createQueryBuilder('auto');
    aplicarFiltros(consulta, filtros);

    const [campo, direccion] = ORDEN_SQL[filtros.orden];
    // Primero se pagina sobre `autos` solamente y después se cargan las fotos;
    // si se hace con un JOIN, el orden y el LIMIT se aplican sobre las filas
    // de imágenes y la paginación sale mal.
    const [autos, total] = await consulta
      .orderBy(campo, direccion)
      .addOrderBy('auto.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount();

    await this.cargarImagenes(autos);
    return {
      datos: autos.map(aResumen),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      paginas: Math.max(1, Math.ceil(total / filtros.limite)),
    };
  }

  async listarDelVendedor(vendedorId: string): Promise<AutoResumen[]> {
    const autos = await this.autos.find({
      where: { vendedorId },
      order: { creadoEn: 'DESC' },
    });
    await this.cargarImagenes(autos);
    return autos.map(aResumen);
  }

  async obtenerDetalle(id: string): Promise<AutoDetalle> {
    const auto = await this.autos.findOne({
      where: { id },
      relations: { vendedor: true, imagenes: true },
    });
    if (!auto) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return aDetalle(auto);
  }

  /** Datos mínimos de un auto, para validar reglas en otros módulos. */
  async obtenerBasico(id: string): Promise<Auto> {
    const auto = await this.autos.findOneBy({ id });
    if (!auto) {
      throw new NotFoundException('Publicación no encontrada');
    }
    return auto;
  }

  /**
   * Publica un auto. Orden de los pasos:
   * 1. Validar y achicar las fotos.
   * 2. Tasar con IA. Si falla, se corta acá y no se guarda nada (503).
   * 3. Subir las fotos al bucket.
   * 4. Guardar auto e imágenes en una transacción.
   * Si 3 o 4 fallan, se borran las fotos ya subidas.
   */
  async publicar(
    vendedorId: string,
    dto: CrearAutoDto,
    archivos: Express.Multer.File[],
  ): Promise<AutoDetalle> {
    validarCantidadImagenes(archivos);
    const procesadas = await procesarImagenes(archivos);
    const tasacion = await this.iaService.tasar(
      dto,
      aImagenesParaTasar(procesadas),
    );

    const autoId = randomUUID();
    const subidos = await this.subirImagenes(autoId, procesadas);
    try {
      await this.baseDeDatos.transaction(async (gestor) => {
        await gestor.insert(Auto, {
          id: autoId,
          vendedorId,
          marca: dto.marca,
          modelo: dto.modelo,
          color: dto.color || null,
          anio: dto.anio,
          kilometraje: dto.kilometraje,
          transmision: dto.transmision,
          combustible: dto.combustible,
          precio: dto.precio,
          ubicacion: dto.ubicacion,
          descripcion: dto.descripcion,
          detallesDanios: dto.detallesDanios || null,
          ...columnasTasacion(tasacion),
        });
        await gestor.insert(ImagenAuto, filasImagenes(autoId, subidos));
      });
    } catch (error) {
      await this.almacenamiento.eliminar(subidos.map((s) => s.rutaArchivo));
      throw error;
    }

    return this.obtenerDetalle(autoId);
  }

  /**
   * Edita precio, kilometraje, descripción o daños y vuelve a tasar con IA.
   * Si se mandan fotos nuevas, reemplazan a todas las anteriores.
   * Si la IA falla, la publicación queda como estaba.
   */
  async editar(
    id: string,
    vendedorId: string,
    dto: EditarAutoDto,
    archivos: Express.Multer.File[],
  ): Promise<AutoDetalle> {
    const auto = await this.obtenerPropio(id, vendedorId);
    if (archivos.length > 0) validarCantidadImagenes(archivos);

    const datos: DatosTasacion = {
      ...auto,
      precio: dto.precio ?? auto.precio,
      kilometraje: dto.kilometraje ?? auto.kilometraje,
      descripcion: dto.descripcion ?? auto.descripcion,
      detallesDanios:
        dto.detallesDanios !== undefined
          ? dto.detallesDanios || null
          : auto.detallesDanios,
    };

    const anteriores = await this.imagenes.find({
      where: { autoId: id },
      order: { orden: 'ASC' },
    });
    const procesadas =
      archivos.length > 0 ? await procesarImagenes(archivos) : [];
    const imagenesParaTasar =
      procesadas.length > 0
        ? aImagenesParaTasar(procesadas)
        : await this.descargarParaTasar(anteriores);

    const tasacion = await this.iaService.tasar(datos, imagenesParaTasar);

    const subidos = await this.subirImagenes(id, procesadas);
    try {
      await this.baseDeDatos.transaction(async (gestor) => {
        await gestor.update(Auto, id, {
          precio: datos.precio,
          kilometraje: datos.kilometraje,
          descripcion: datos.descripcion,
          detallesDanios: datos.detallesDanios,
          ...columnasTasacion(tasacion),
        });
        if (subidos.length > 0) {
          await gestor.delete(ImagenAuto, {
            id: In(anteriores.map((i) => i.id)),
          });
          await gestor.insert(ImagenAuto, filasImagenes(id, subidos));
        }
      });
    } catch (error) {
      await this.almacenamiento.eliminar(subidos.map((s) => s.rutaArchivo));
      throw error;
    }

    if (subidos.length > 0) {
      await this.almacenamiento.eliminar(anteriores.map((i) => i.rutaArchivo));
    }
    return this.obtenerDetalle(id);
  }

  /** Borra la publicación, sus imágenes y sus consultas (cascada en la base). */
  async eliminar(id: string, vendedorId: string): Promise<void> {
    await this.obtenerPropio(id, vendedorId);
    const imagenes = await this.imagenes.findBy({ autoId: id });
    await this.autos.delete(id);
    await this.almacenamiento.eliminar(imagenes.map((i) => i.rutaArchivo));
  }

  private async obtenerPropio(id: string, vendedorId: string): Promise<Auto> {
    const auto = await this.obtenerBasico(id);
    if (auto.vendedorId !== vendedorId) {
      throw new ForbiddenException(
        'Solo el vendedor puede modificar esta publicación',
      );
    }
    return auto;
  }

  /**
   * Al editar sin fotos nuevas se vuelven a tasar las guardadas: se descargan
   * y se achican antes de armar el mosaico.
   */
  private async descargarParaTasar(
    imagenes: ImagenAuto[],
  ): Promise<ImagenParaTasar[]> {
    const primeras = imagenes.slice(0, MAXIMO_FOTOS_MOSAICO);
    try {
      return await Promise.all(
        primeras.map(async (imagen) => {
          const respuesta = await fetch(imagen.urlPublica);
          if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
          const original = Buffer.from(await respuesta.arrayBuffer());
          return { datos: await achicarParaIa(original), mime: 'image/jpeg' };
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudieron leer las fotos guardadas: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(MENSAJE_IA_NO_DISPONIBLE);
    }
  }

  private async cargarImagenes(autos: Auto[]): Promise<void> {
    if (autos.length === 0) return;
    const imagenes = await this.imagenes.find({
      where: { autoId: In(autos.map((a) => a.id)) },
      order: { orden: 'ASC' },
    });
    for (const auto of autos) {
      auto.imagenes = imagenes.filter((imagen) => imagen.autoId === auto.id);
    }
  }

  /** Sube las fotos una por una; si alguna falla, borra las que ya subió. */
  private async subirImagenes(
    autoId: string,
    procesadas: ImagenProcesada[],
  ): Promise<ArchivoSubido[]> {
    const subidos: ArchivoSubido[] = [];
    try {
      for (const imagen of procesadas) {
        subidos.push(await this.almacenamiento.subir(autoId, imagen.guardado));
      }
      return subidos;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      await this.almacenamiento.eliminar(subidos.map((s) => s.rutaArchivo));
      throw error;
    }
  }
}

function aplicarFiltros(
  consulta: SelectQueryBuilder<Auto>,
  filtros: FiltrarAutosDto,
): void {
  if (filtros.texto) {
    // Cada palabra tiene que aparecer en la marca o en el modelo.
    filtros.texto
      .split(/\s+/)
      .slice(0, 5)
      .forEach((palabra, i) => {
        consulta.andWhere(
          `(auto.marca ILIKE :texto${i} OR auto.modelo ILIKE :texto${i})`,
          { [`texto${i}`]: `%${escaparLike(palabra)}%` },
        );
      });
  }

  const textos = {
    marca: filtros.marca,
    modelo: filtros.modelo,
    ubicacion: filtros.ubicacion,
  };
  for (const [campo, valor] of Object.entries(textos)) {
    if (valor) {
      consulta.andWhere(`auto.${campo} ILIKE :${campo}`, {
        [campo]: `%${escaparLike(valor)}%`,
      });
    }
  }

  const rangos: [string, number | undefined, number | undefined][] = [
    ['precio', filtros.precioMin, filtros.precioMax],
    ['anio', filtros.anioMin, filtros.anioMax],
    ['kilometraje', filtros.kmMin, filtros.kmMax],
  ];
  for (const [campo, minimo, maximo] of rangos) {
    if (minimo !== undefined) {
      consulta.andWhere(`auto.${campo} >= :${campo}Min`, {
        [`${campo}Min`]: minimo,
      });
    }
    if (maximo !== undefined) {
      consulta.andWhere(`auto.${campo} <= :${campo}Max`, {
        [`${campo}Max`]: maximo,
      });
    }
  }

  if (filtros.combustible) {
    consulta.andWhere('auto.combustible = :combustible', {
      combustible: filtros.combustible,
    });
  }
  if (filtros.transmision) {
    consulta.andWhere('auto.transmision = :transmision', {
      transmision: filtros.transmision,
    });
  }
}

/** Evita que `%` o `_` escritos por el usuario funcionen como comodines. */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

function validarCantidadImagenes(archivos: Express.Multer.File[]): void {
  if (archivos.length < MINIMO_IMAGENES) {
    throw new BadRequestException(
      `Subí al menos ${MINIMO_IMAGENES} fotos del auto`,
    );
  }
  if (archivos.length > MAXIMO_IMAGENES) {
    throw new BadRequestException(`Podés subir hasta ${MAXIMO_IMAGENES} fotos`);
  }
}

function aImagenesParaTasar(procesadas: ImagenProcesada[]): ImagenParaTasar[] {
  return procesadas.map((imagen) => ({
    datos: imagen.paraIa,
    mime: 'image/jpeg',
  }));
}

function columnasTasacion(tasacion: ResultadoTasacion): Partial<Auto> {
  return {
    iaEstado: tasacion.estado,
    iaPuntaje: tasacion.puntaje,
    iaDanios: tasacion.danios,
    iaPrecioMin: tasacion.precioMin,
    iaPrecioMax: tasacion.precioMax,
    iaResumen: tasacion.resumen,
  };
}

function filasImagenes(
  autoId: string,
  subidos: ArchivoSubido[],
): Partial<ImagenAuto>[] {
  return subidos.map((subido, orden) => ({ autoId, ...subido, orden }));
}
