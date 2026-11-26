export const VEHICLE_CONDITIONS = [
  'Excelente',
  'Buen estado',
  'Regular',
  'Requiere reparacion',
] as const;

export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number];

export interface AppraisalInput {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  price: number;
  location: string;
  description: string;
  damageDetails?: string | null;
}

export interface AppraisalResult {
  condition: VehicleCondition;
  score: number;
  damages: string;
  minPrice: number;
  maxPrice: number;
  summary: string;
}

/** Foto ya achicada que se manda al modelo. */
export interface AppraisalImage {
  data: Buffer;
  mime: string;
}
