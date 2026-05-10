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
import { TipoCombustible, TipoTransmision } from '../auto.entity';

export class CrearAutoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  marca: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  modelo: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @IsInt()
  @Min(0)
  kilometraje: number;

  @IsEnum(TipoTransmision)
  transmision: TipoTransmision;

  @IsEnum(TipoCombustible)
  combustible: TipoCombustible;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  ubicacion: string;

  @IsString()
  @MinLength(10)
  descripcion: string;

  @IsOptional()
  @IsString()
  detallesDanios?: string;
}
