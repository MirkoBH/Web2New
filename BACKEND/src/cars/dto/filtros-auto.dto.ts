import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { TipoCombustible, TipoTransmision } from '../auto.entity';

export class FiltrosAutoDto {
  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @IsOptional()
  @IsNumber()
  precioMax?: number;

  @IsOptional()
  @IsInt()
  anioMin?: number;

  @IsOptional()
  @IsInt()
  anioMax?: number;

  @IsOptional()
  @IsEnum(TipoCombustible)
  combustible?: TipoCombustible;

  @IsOptional()
  @IsEnum(TipoTransmision)
  transmision?: TipoTransmision;

  @IsOptional()
  @IsString()
  orden?: 'reciente' | 'precio_asc' | 'precio_desc' | 'km_asc';

  @IsOptional()
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}
