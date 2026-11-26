import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimText } from '../../common/transforms';
import { MaxYear } from '../../common/validators/max-year';
import { Fuel, Transmission } from '../car.entity';

export const MIN_YEAR = 1950;

/**
 * Los datos llegan como `multipart/form-data` (junto con las fotos), por eso
 * todos los valores vienen como texto y se convierten con `@Type`.
 */
export class CreateCarDto {
  @Transform(trimText)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  brand: string;

  @Transform(trimText)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(40)
  color?: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR, { message: `El año no puede ser menor a ${MIN_YEAR}` })
  @MaxYear()
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  mileage: number;

  @IsEnum(Transmission, {
    message: 'La transmisión debe ser Manual o Automatico',
  })
  transmission: Transmission;

  @IsEnum(Fuel, {
    message: 'El combustible debe ser Nafta, Diesel, Hibrido o Electrico',
  })
  fuel: Fuel;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(99_999_999)
  price: number;

  @Transform(trimText)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  location: string;

  @Transform(trimText)
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  description: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(1000)
  damageDetails?: string;
}
