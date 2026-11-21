import type { TransformFnParams } from 'class-transformer';

/** Quita espacios al principio y al final de un texto. */
export function limpiarTexto({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Normaliza un email para compararlo sin importar mayúsculas. */
export function normalizarEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
