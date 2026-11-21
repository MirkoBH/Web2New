import type { Auto } from './auto.entity';
import type { ImagenAuto } from './imagen-auto.entity';

/** Lo que se muestra de cada auto en el listado. */
export interface AutoResumen {
  id: string;
  vendedorId: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  combustible: string;
  precio: number;
  ubicacion: string;
  analisisIa: {
    estado: string;
    puntaje: number;
    precioMin: number;
    precioMax: number;
  };
  imagenPrincipal: string | null;
  creadoEn: Date;
}

/** Detalle completo de una publicación. Del vendedor solo se expone el nombre. */
export interface AutoDetalle extends Omit<
  AutoResumen,
  'analisisIa' | 'imagenPrincipal'
> {
  color: string | null;
  descripcion: string;
  detallesDanios: string | null;
  analisisIa: AutoResumen['analisisIa'] & { danios: string; resumen: string };
  imagenes: { id: string; url: string }[];
  vendedor: { id: string; nombre: string };
  actualizadoEn: Date;
}

export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}

function ordenarImagenes(imagenes: ImagenAuto[] = []): ImagenAuto[] {
  return [...imagenes].sort((a, b) => a.orden - b.orden);
}

export function aResumen(auto: Auto): AutoResumen {
  return {
    id: auto.id,
    vendedorId: auto.vendedorId,
    marca: auto.marca,
    modelo: auto.modelo,
    anio: auto.anio,
    kilometraje: auto.kilometraje,
    transmision: auto.transmision,
    combustible: auto.combustible,
    precio: auto.precio,
    ubicacion: auto.ubicacion,
    analisisIa: {
      estado: auto.iaEstado,
      puntaje: auto.iaPuntaje,
      precioMin: auto.iaPrecioMin,
      precioMax: auto.iaPrecioMax,
    },
    imagenPrincipal: ordenarImagenes(auto.imagenes)[0]?.urlPublica ?? null,
    creadoEn: auto.creadoEn,
  };
}

export function aDetalle(auto: Auto): AutoDetalle {
  const resumen = aResumen(auto);
  return {
    id: resumen.id,
    vendedorId: resumen.vendedorId,
    marca: resumen.marca,
    modelo: resumen.modelo,
    anio: resumen.anio,
    kilometraje: resumen.kilometraje,
    transmision: resumen.transmision,
    combustible: resumen.combustible,
    precio: resumen.precio,
    ubicacion: resumen.ubicacion,
    creadoEn: resumen.creadoEn,
    color: auto.color,
    descripcion: auto.descripcion,
    detallesDanios: auto.detallesDanios,
    analisisIa: {
      ...resumen.analisisIa,
      danios: auto.iaDanios,
      resumen: auto.iaResumen,
    },
    imagenes: ordenarImagenes(auto.imagenes).map((imagen) => ({
      id: imagen.id,
      url: imagen.urlPublica,
    })),
    vendedor: { id: auto.vendedor.id, nombre: auto.vendedor.nombre },
    actualizadoEn: auto.actualizadoEn,
  };
}
