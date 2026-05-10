import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;
}
