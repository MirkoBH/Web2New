import type { TransformFnParams } from 'class-transformer';

/** Quita espacios al principio y al final de un texto. */
export function limpiarTexto({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Normaliza un email para compararlo sin importar mayúsculas. */
export function normalizarEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/** Texto vacío se toma como "sin dato" (null), para poder borrar un campo opcional. */
export function vacioANulo({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value;
  return value.trim() === '' ? null : value.trim();
}
