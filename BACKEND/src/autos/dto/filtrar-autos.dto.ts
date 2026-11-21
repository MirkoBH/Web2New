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
import { limpiarTexto } from '../../comun/transformaciones';
import { Combustible, Transmision } from '../auto.entity';

export const ORDENES = [
  'reciente',
  'precio_asc',
  'precio_desc',
  'km_asc',
] as const;
export type Orden = (typeof ORDENES)[number];

export class FiltrarAutosDto {
  @IsOptional()
  @Transform(limpiarTexto)
  @IsString()
  @MaxLength(60)
  marca?: string;

  @IsOptional()
  @Transform(limpiarTexto)
  @IsString()
  @MaxLength(80)
  modelo?: string;

  @IsOptional()
  @Transform(limpiarTexto)
  @IsString()
  @MaxLength(100)
  ubicacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  anioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2100)
  anioMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmMax?: number;

  @IsOptional()
  @IsEnum(Combustible)
  combustible?: Combustible;

  @IsOptional()
  @IsEnum(Transmision)
  transmision?: Transmision;

  @IsOptional()
  @IsIn(ORDENES)
  orden: Orden = 'reciente';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 12;
}
