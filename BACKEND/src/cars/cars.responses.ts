import type { Car } from './car.entity';
import type { CarImage } from './car-image.entity';

/** Lo que se muestra de cada auto en el listado. */
export interface CarSummary {
  id: string;
  sellerId: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  price: number;
  location: string;
  aiAnalysis: {
    condition: string;
    score: number;
    minPrice: number;
    maxPrice: number;
  };
  mainImage: string | null;
  createdAt: Date;
}

/** Detalle completo de una publicación. Del vendedor solo se expone el nombre. */
export interface CarDetail extends Omit<
  CarSummary,
  'aiAnalysis' | 'mainImage'
> {
  color: string | null;
  description: string;
  damageDetails: string | null;
  aiAnalysis: CarSummary['aiAnalysis'] & { damages: string; summary: string };
  images: { id: string; url: string }[];
  seller: { id: string; name: string };
  updatedAt: Date;
}

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function sortImages(images: CarImage[] = []): CarImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export function toSummary(car: Car): CarSummary {
  return {
    id: car.id,
    sellerId: car.sellerId,
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    transmission: car.transmission,
    fuel: car.fuel,
    price: car.price,
    location: car.location,
    aiAnalysis: {
      condition: car.aiCondition,
      score: car.aiScore,
      minPrice: car.aiMinPrice,
      maxPrice: car.aiMaxPrice,
    },
    mainImage: sortImages(car.images)[0]?.publicUrl ?? null,
    createdAt: car.createdAt,
  };
}

export function toDetail(car: Car): CarDetail {
  const summary = toSummary(car);
  return {
    id: summary.id,
    sellerId: summary.sellerId,
    brand: summary.brand,
    model: summary.model,
    year: summary.year,
    mileage: summary.mileage,
    transmission: summary.transmission,
    fuel: summary.fuel,
    price: summary.price,
    location: summary.location,
    createdAt: summary.createdAt,
    color: car.color,
    description: car.description,
    damageDetails: car.damageDetails,
    aiAnalysis: {
      ...summary.aiAnalysis,
      damages: car.aiDamages,
      summary: car.aiSummary,
    },
    images: sortImages(car.images).map((image) => ({
      id: image.id,
      url: image.publicUrl,
    })),
    seller: { id: car.seller.id, name: car.seller.name },
    updatedAt: car.updatedAt,
  };
}
