import {
  ESTADOS_VEHICULO,
  EstadoVehiculo,
  ResultadoTasacion,
} from './ia.types';

const LARGO_MAXIMO_DANIOS = 1000;
const LARGO_MAXIMO_RESUMEN = 1500;
const PRECIO_MAXIMO = 10_000_000;

/**
 * La respuesta del modelo no es confiable: se valida campo por campo.
 * Devuelve `null` si no se puede armar una tasación coherente.
 */
export function validarTasacion(crudo: unknown): ResultadoTasacion | null {
  if (typeof crudo !== 'object' || crudo === null) return null;
  const datos = crudo as Record<string, unknown>;

  const estado = normalizarEstado(datos.estado);
  const puntaje = Number(datos.puntaje);
  let precioMin = Math.round(Number(datos.rangoPrecioMin));
  let precioMax = Math.round(Number(datos.rangoPrecioMax));
  const danios = texto(datos.danios, LARGO_MAXIMO_DANIOS);
  const resumen = texto(datos.resumen, LARGO_MAXIMO_RESUMEN);

  if (!estado || !Number.isFinite(puntaje) || !resumen) return null;
  if (!esPrecioValido(precioMin) || !esPrecioValido(precioMax)) return null;
  if (precioMin > precioMax) [precioMin, precioMax] = [precioMax, precioMin];

  return {
    estado,
    puntaje: Math.round(Math.min(10, Math.max(1, puntaje)) * 10) / 10,
    danios: danios || 'Sin daños detectados',
    precioMin,
    precioMax,
    resumen,
  };
}

function normalizarEstado(valor: unknown): EstadoVehiculo | null {
  if (typeof valor !== 'string') return null;
  const limpio = sinAcentos(valor).trim().toLowerCase();
  return (
    ESTADOS_VEHICULO.find((estado) => estado.toLowerCase() === limpio) ?? null
  );
}

function texto(valor: unknown, largoMaximo: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, largoMaximo) : '';
}

function esPrecioValido(precio: number): boolean {
  return Number.isInteger(precio) && precio > 0 && precio <= PRECIO_MAXIMO;
}

function sinAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
