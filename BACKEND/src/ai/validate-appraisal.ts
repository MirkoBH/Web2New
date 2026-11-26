import {
  VEHICLE_CONDITIONS,
  VehicleCondition,
  AppraisalResult,
} from './ai.types';

const MAX_DAMAGES_LENGTH = 1000;
const MAX_SUMMARY_LENGTH = 1500;
const MAX_PRICE = 10_000_000;

/**
 * La respuesta del modelo no es confiable: se valida campo por campo.
 * Devuelve `null` si no se puede armar una tasación coherente.
 */
export function validateAppraisal(raw: unknown): AppraisalResult | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;

  const condition = normalizeCondition(data.condition);
  const score = Number(data.score);
  let minPrice = Math.round(Number(data.minPrice));
  let maxPrice = Math.round(Number(data.maxPrice));
  const damages = text(data.damages, MAX_DAMAGES_LENGTH);
  const summary = text(data.summary, MAX_SUMMARY_LENGTH);

  if (!condition || !Number.isFinite(score) || !summary) return null;
  if (!isValidPrice(minPrice) || !isValidPrice(maxPrice)) return null;
  if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  return {
    condition,
    score: Math.round(Math.min(10, Math.max(1, score)) * 10) / 10,
    damages: damages || 'Sin daños detectados',
    minPrice,
    maxPrice,
    summary,
  };
}

function normalizeCondition(value: unknown): VehicleCondition | null {
  if (typeof value !== 'string') return null;
  const cleaned = stripAccents(value).trim().toLowerCase();
  return (
    VEHICLE_CONDITIONS.find(
      (condition) => condition.toLowerCase() === cleaned,
    ) ?? null
  );
}

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price > 0 && price <= MAX_PRICE;
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
