import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimText } from '../../common/transforms';
import { MaxYear } from '../../common/validators/max-year';
import { Fuel, Transmission } from '../car.entity';
import { MIN_YEAR } from './create-car.dto';

export const SORT_OPTIONS = [
  'newest',
  'price_asc',
  'price_desc',
  'mileage_asc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export class FilterCarsDto {
  /** Búsqueda libre: coincide con la marca, el modelo o ambos ("toyota corolla"). */
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(60)
  brand?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR, { message: `El año no puede ser menor a ${MIN_YEAR}` })
  @MaxYear()
  minYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR, { message: `El año no puede ser menor a ${MIN_YEAR}` })
  @MaxYear()
  maxYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxKm?: number;

  @IsOptional()
  @IsEnum(Fuel)
  fuel?: Fuel;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: SortOption = 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;
}
