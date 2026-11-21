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
import { limpiarTexto } from '../../comun/transformaciones';
import { Combustible, Transmision } from '../auto.entity';

const ANIO_MINIMO = 1950;
const ANIO_MAXIMO = new Date().getFullYear() + 1;

/**
 * Los datos llegan como `multipart/form-data` (junto con las fotos), por eso
 * todos los valores vienen como texto y se convierten con `@Type`.
 */
export class CrearAutoDto {
  @Transform(limpiarTexto)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  marca: string;

  @Transform(limpiarTexto)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  modelo: string;

  @IsOptional()
  @Transform(limpiarTexto)
  @IsString()
  @MaxLength(40)
  color?: string;

  @Type(() => Number)
  @IsInt()
  @Min(ANIO_MINIMO)
  @Max(ANIO_MAXIMO)
  anio: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  kilometraje: number;

  @IsEnum(Transmision, {
    message: 'La transmisión debe ser Manual o Automatico',
  })
  transmision: Transmision;

  @IsEnum(Combustible, {
    message: 'El combustible debe ser Nafta, Diesel, Hibrido o Electrico',
  })
  combustible: Combustible;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(99_999_999)
  precio: number;

  @Transform(limpiarTexto)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  ubicacion: string;

  @Transform(limpiarTexto)
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  descripcion: string;

  @IsOptional()
  @Transform(limpiarTexto)
  @IsString()
  @MaxLength(1000)
  detallesDanios?: string;
}
