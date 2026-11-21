export const ESTADOS_VEHICULO = [
  'Excelente',
  'Buen estado',
  'Regular',
  'Requiere reparacion',
] as const;

export type EstadoVehiculo = (typeof ESTADOS_VEHICULO)[number];

export interface DatosTasacion {
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  combustible: string;
  transmision: string;
  precio: number;
  ubicacion: string;
  descripcion: string;
  detallesDanios?: string | null;
}

export interface ResultadoTasacion {
  estado: EstadoVehiculo;
  puntaje: number;
  danios: string;
  precioMin: number;
  precioMax: number;
  resumen: string;
}

/**
 * Imagen que se manda al modelo: un buffer ya procesado (al publicar) o la
 * URL pública de una imagen guardada (al editar sin fotos nuevas).
 */
export type ImagenParaTasar =
  | { tipo: 'buffer'; datos: Buffer; mime: string }
  | { tipo: 'url'; url: string };
